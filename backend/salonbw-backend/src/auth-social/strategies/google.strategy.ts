import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
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
            callbackURL: '/auth/social/google/callback',
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });
    }

    validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
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
