import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private readonly config: ConfigService) {
        const clientID = config.get<string>('FACEBOOK_APP_ID');
        const clientSecret = config.get<string>('FACEBOOK_APP_SECRET');
        
        if (!clientID || !clientSecret) {
            throw new Error('Facebook OAuth credentials not configured');
        }

        super({
            clientID,
            clientSecret,
            callbackURL: '/auth/social/facebook/callback',
            scope: ['email', 'public_profile'],
            profileFields: ['id', 'emails', 'name', 'photos'],
            passReqToCallback: true,
        });
    }

    async validate(
        req: any,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any,
    ): Promise<any> {
        const { id, emails, name, photos } = profile;
        
        if (!emails?.[0]?.value) {
            return done(new UnauthorizedException('No email from Facebook'), false);
        }

        const user = {
            id,
            email: emails[0].value,
            firstName: name?.givenName,
            lastName: name?.familyName,
            picture: photos?.[0]?.value,
            provider: 'facebook',
        };
        
        done(null, user);
    }
}
