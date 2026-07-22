import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
    Profile as GoogleProfile,
    Strategy,
    VerifyCallback,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly config: ConfigService) {
        const clientID = config.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');

        if (!clientID || !clientSecret) {
            throw new Error('Google OAuth credentials not configured');
        }

        super({
            clientID,
            clientSecret,
            // Must be an ABSOLUTE https URL matching the redirect URI registered
            // in Google Cloud Console (Google rejects relative URIs).
            callbackURL:
                config.get<string>('GOOGLE_CALLBACK_URL') ||
                'https://api.salon-bw.pl/auth/social/google/callback',
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }

    validate(
        _req: unknown,
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback,
    ): void {
        const { id, emails, name, photos } = profile;

        if (!emails?.[0]?.value) {
            done(new UnauthorizedException('No email from Google'), false);
            return;
        }

        const user = {
            id,
            email: emails[0].value,
            firstName: name?.givenName,
            lastName: name?.familyName,
            picture: photos?.[0]?.value,
            provider: 'google',
        };

        done(null, user);
    }
}
