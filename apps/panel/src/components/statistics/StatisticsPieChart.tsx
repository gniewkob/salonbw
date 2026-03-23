import { useMemo } from 'react';

interface PieSlice {
    label: string;
    value: number;
    color: string;
}

interface Props {
    width: number;
    height: number;
    data: PieSlice[];
}

/**
 * jqplot-style pie chart — SVG with positioned legend table.
 * Matches source UI's #chart / #chart2 visual output.
 */
export default function StatisticsPieChart({ width, height, data }: Props) {
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const slices = useMemo(() => {
        if (total <= 0) {
            return [{ ...data[0], startAngle: 0, endAngle: 2 * Math.PI }];
        }
        let angle = -Math.PI / 2;
        return data.map((d) => {
            const sweep = (d.value / total) * 2 * Math.PI;
            const start = angle;
            angle += sweep;
            return { ...d, startAngle: start, endAngle: angle };
        });
    }, [data, total]);

    const cx = height / 2 - 10;
    const cy = height / 2;
    const r = Math.min(height / 2, cx) - 10;

    const arc = (startAngle: number, endAngle: number, radius: number) => {
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const large = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    };

    return (
        <div
            className="statistics-jqplot-wrap"
            {...{ style: { width, height, position: 'relative' } }}
        >
            <svg
                width={height * 1.1}
                height={height}
                {...{ style: { position: 'absolute', left: 0, top: 0 } }}
                aria-hidden="true"
            >
                {slices.map((slice, i) => {
                    const isFullCircle =
                        slice.endAngle - slice.startAngle >=
                        2 * Math.PI - 0.001;
                    return isFullCircle ? (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill={slice.color}
                        />
                    ) : (
                        <path
                            key={i}
                            d={arc(slice.startAngle, slice.endAngle, r)}
                            fill={slice.color}
                            stroke="#fff"
                            strokeWidth={1}
                        />
                    );
                })}
            </svg>
            <table
                className="statistics-jqplot-legend"
                {...{
                    style: {
                        position: 'absolute',
                        right: 0,
                        top: cy - (data.length * 20) / 2,
                    },
                }}
            >
                <tbody>
                    {data.map((d, i) => (
                        <tr key={i}>
                            <td
                                {...{
                                    style: {
                                        paddingTop: i > 0 ? '0.5em' : 0,
                                    },
                                }}
                            >
                                <div className="statistics-jqplot-swatch-outer">
                                    <div
                                        className="statistics-jqplot-swatch"
                                        {...{
                                            style: {
                                                backgroundColor: d.color,
                                                borderColor: d.color,
                                            },
                                        }}
                                    />
                                </div>
                            </td>
                            <td
                                className="statistics-jqplot-label"
                                {...{
                                    style: {
                                        paddingTop: i > 0 ? '0.5em' : 0,
                                    },
                                }}
                            >
                                {d.label}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
