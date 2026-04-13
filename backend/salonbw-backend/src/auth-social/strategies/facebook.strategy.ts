import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { SocialAuthService, SocialUser } from '../social-auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
        private readonly configService: ConfigService,
        private readonly socialAuthService: SocialAuthService,
    ) {
        super({
            clientID: configService.get<string>('FACEBOOK_APP_ID') || 'dummy',
            clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || 'dummy',
            callbackURL: configService.get<string>('BACKEND_URL', 'http://localhost:3001') + '/auth/social/facebook/callback',
            scope: ['email', 'public_profile'],
            profileFields: ['id', 'emails', 'name'],
        } as any);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { name, emails, id } = profile;
        const socialUser: SocialUser = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            provider: 'facebook',
            providerId: id,
        };
        const user = await this.socialAuthService.validateSocialUser(socialUser);
        done(null, user);
    }
}
