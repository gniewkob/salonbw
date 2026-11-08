import { registrationMarketingChannels } from '@/utils/registrationMarketing';

describe('registration marketing consent', () => {
    it('defaults to no marketing for every channel', () => {
        expect(registrationMarketingChannels(false)).toEqual({
            emailConsent: false,
            smsConsent: false,
            whatsappConsent: false,
        });
    });

    it('maps one explicit direct-marketing choice to the named channels', () => {
        expect(registrationMarketingChannels(true)).toEqual({
            emailConsent: true,
            smsConsent: true,
            whatsappConsent: true,
        });
    });
});
