import { MigrationInterface, QueryRunner } from 'typeorm';

type AppointmentNoteRow = {
    id: number;
    notes: string | null;
};

type ParsedAppointmentNotes = {
    clientComment: string | null;
    staffRecommendations: string | null;
    onlineAddonsSummary: string | null;
    onlineTotalDurationMinutes: number | null;
    onlineDurationNeedsVerification: boolean;
};

function cleanText(value: string | null | undefined): string | null {
    const cleaned = value?.replace(/^[—\s.]+|[—\s.]+$/g, '').trim();
    return cleaned || null;
}

function parseLegacyAppointmentNotes(
    notes: string | null,
): ParsedAppointmentNotes {
    let remainder = notes?.trim() ?? '';
    const parsed: ParsedAppointmentNotes = {
        clientComment: null,
        staffRecommendations: null,
        onlineAddonsSummary: null,
        onlineTotalDurationMinutes: null,
        onlineDurationNeedsVerification: false,
    };
    if (!remainder) return parsed;

    const prefixedRecommendation = remainder.match(
        /^(Zalecenia(?:\s+po\s+wizycie)?|Rekomendacje)\s*:\s*([\s\S]+)$/i,
    );
    if (prefixedRecommendation?.[2]?.trim()) {
        parsed.staffRecommendations = prefixedRecommendation[2].trim();
        return parsed;
    }

    const addonMatch = remainder.match(
        /Dodatki wybrane online:\s*([\s\S]*?)(?=Łączny czas wizyty:|$)/i,
    );
    if (addonMatch?.[1]?.trim()) {
        const addonStart = addonMatch.index ?? 0;
        const addonEnd = addonStart + addonMatch[0].length;
        parsed.clientComment = cleanText(remainder.slice(0, addonStart));
        parsed.onlineAddonsSummary = addonMatch[1]
            .split(/,\s*/)
            .map((item) => item.replace(/[.\s]+$/g, '').trim())
            .filter(Boolean)
            .join(', ');
        remainder = remainder.slice(addonEnd).trim();
    }

    const durationMatch = remainder.match(
        /Łączny czas wizyty:\s*([0-9]+)\s*min/i,
    );
    if (durationMatch?.[1]) {
        parsed.onlineTotalDurationMinutes = Number(durationMatch[1]);
        remainder = remainder.replace(durationMatch[0], ' ').trim();
    }

    const verificationMatch = remainder.match(
        /[—-]?\s*do weryfikacji przy potwierdzeniu\.?/i,
    );
    if (verificationMatch) {
        parsed.onlineDurationNeedsVerification = true;
        remainder = remainder
            .slice((verificationMatch.index ?? 0) + verificationMatch[0].length)
            .trim();
        parsed.staffRecommendations = cleanText(remainder);
        return parsed;
    }

    const leftover = cleanText(remainder);
    if (leftover && !parsed.clientComment) {
        parsed.clientComment = leftover;
    }

    return parsed;
}

export class NormalizeAppointmentNotesArchitecture1762550000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows = (await queryRunner.query(
            `SELECT "id", "notes"
               FROM "appointments"
              WHERE "notes" IS NOT NULL AND btrim("notes") <> ''`,
        )) as AppointmentNoteRow[];

        for (const row of rows) {
            const parsed = parseLegacyAppointmentNotes(row.notes);
            await queryRunner.query(
                `UPDATE "appointments"
                    SET "clientComment" = COALESCE(NULLIF("clientComment", ''), $2),
                        "staffRecommendations" = COALESCE(NULLIF("staffRecommendations", ''), $3),
                        "onlineAddonsSummary" = COALESCE(NULLIF("onlineAddonsSummary", ''), $4),
                        "onlineTotalDurationMinutes" = COALESCE("onlineTotalDurationMinutes", $5),
                        "onlineDurationNeedsVerification" = COALESCE("onlineDurationNeedsVerification", false) OR $6,
                        "notes" = NULL
                  WHERE "id" = $1`,
                [
                    row.id,
                    parsed.clientComment,
                    parsed.staffRecommendations,
                    parsed.onlineAddonsSummary,
                    parsed.onlineTotalDurationMinutes,
                    parsed.onlineDurationNeedsVerification,
                ],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "appointments"
                SET "notes" = NULLIF(
                    concat_ws(E'\n\n',
                        NULLIF("clientComment", ''),
                        CASE
                            WHEN NULLIF("onlineAddonsSummary", '') IS NULL THEN NULL
                            WHEN "onlineTotalDurationMinutes" IS NULL THEN
                                concat('Dodatki wybrane online: ', "onlineAddonsSummary", '.')
                            WHEN "onlineDurationNeedsVerification" THEN
                                concat('Dodatki wybrane online: ', "onlineAddonsSummary", '. Łączny czas wizyty: ', "onlineTotalDurationMinutes", ' min — do weryfikacji przy potwierdzeniu.')
                            ELSE
                                concat('Dodatki wybrane online: ', "onlineAddonsSummary", '. Łączny czas wizyty: ', "onlineTotalDurationMinutes", ' min.')
                        END,
                        CASE
                            WHEN NULLIF("staffRecommendations", '') IS NULL THEN NULL
                            ELSE concat('Zalecenia po wizycie: ', "staffRecommendations")
                        END
                    ),
                    ''
                )
              WHERE "notes" IS NULL`,
        );
    }
}
