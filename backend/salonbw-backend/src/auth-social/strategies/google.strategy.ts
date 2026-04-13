import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { SocialAuthService, SocialUser } from '../social-auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly configService: ConfigService,
        private readonly socialAuthService: SocialAuthService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'dummy',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'dummy',
            callbackURL: configService.get<string>('BACKEND_URL', 'http://localhost:3001') + '/auth/social/google/callback',
            scope: ['email', 'profile'],
        } as any);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails, id } = profile;
        const socialUser: SocialUser = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            provider: 'google',
            providerId: id,
        };
        const user = await this.socialAuthService.validateSocialUser(socialUser);
        done(null, user);
    }
}
