import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SocialAuthButtons() {
    const handleSocialLogin = (provider: string) => {
        window.location.href = `${API_URL}/auth/social/${provider}`;
    };

    return (
        <div className="mt-4">
            <div className="position-relative mb-4">
                <hr className="text-muted" />
                <span 
                    className="position-absolute top-50 start-50 translate-middle px-3 bg-light text-muted small"
                    style={{ whiteSpace: 'nowrap' }}
                >
                    lub kontynuuj przez
                </span>
            </div>

            <div className="d-grid gap-2">
                <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="btn btn-outline-dark d-flex align-items-center justify-content-center py-2"
                >
                    <img 
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                        alt="Google" 
                        className="me-2"
                        style={{ width: '18px', height: '18px' }}
                    />
                    Konto Google
                </button>

                <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    className="btn btn-primary d-flex align-items-center justify-content-center py-2"
                    style={{ backgroundColor: '#1877F2', border: 'none' }}
                >
                    <i className="sprite-social_facebook_white me-2" style={{ display: 'block', width: '18px', height: '18px' }}></i>
                    Konto Facebook
                </button>

                <button
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    className="btn btn-dark d-flex align-items-center justify-content-center py-2"
                >
                    <i className="sprite-social_apple_white me-2" style={{ display: 'block', width: '18px', height: '18px' }}></i>
                    Konto Apple
                </button>
            </div>
        </div>
    );
}
