import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import FAQAccordion, { FAQItem } from '@/components/FAQAccordion';

export default function HomePage() {
    const heroImages = [
        '/assets/img/slider/slider1.jpg',
        '/assets/img/slider/slider2.jpg',
        '/assets/img/slider/slider3.jpg',
    ];

    const services = [
        {
            title: 'Haircut',
            description: 'Professional cuts tailored to you.',
        },
        {
            title: 'Coloring',
            description: 'Vibrant colors and highlights.',
        },
        { title: 'Styling', description: 'Perfect style for any occasion.' },
        { title: 'Makeup', description: 'Look your best with our artists.' },
    ];

    const galleryImages = heroImages;

    const testimonials = [
        { name: 'Jane', text: 'Amazing service!' },
        { name: 'Sara', text: 'Loved my new look.' },
        { name: 'Mia', text: 'Friendly staff and great atmosphere.' },
    ];

    const faqs: FAQItem[] = [
        {
            question: 'What are your opening hours?',
            answer: 'We are open from 9AM to 5PM Monday through Friday.',
        },
        {
            question: 'How can I book an appointment?',
            answer: 'You can call us or use the contact form to schedule an appointment.',
        },
        {
            question: 'Do you accept walk-ins?',
            answer: 'Yes, walk-ins are welcome when availability permits.',
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [testimonialIndex, setTestimonialIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <>
            <Head>
                <title>
                    Salon Black &amp; White | Professional Hair &amp; Beauty
                </title>
                <meta
                    name="description"
                    content="Home of Salon Black &amp; White offering professional hair and beauty services."
                />
            </Head>
            <div className="space-y-12">
                {/* Hero Banner */}
                <section className="relative w-full h-64 sm:h-96 overflow-hidden">
                    {heroImages.map((src, index) => (
                        <Image
                            key={src}
                            src={src}
                            alt="Salon highlight"
                            fill
                            className={`object-cover transition-opacity duration-700 ${
                                index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                            priority={index === 0}
                        />
                    ))}
                </section>

                {/* Featured Services */}
                <section className="p-4 space-y-4">
                    <h2 className="text-xl font-bold text-center">
                        Featured Services
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.map((service) => (
                            <div
                                key={service.title}
                                className="p-4 border rounded text-center"
                            >
                                <h3 className="font-semibold">{service.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Mini Gallery */}
                <section className="p-4 space-y-4">
                    <h2 className="text-xl font-bold text-center">Gallery</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {galleryImages.map((src) => (
                            <div
                                key={src}
                                className="relative w-full h-24 sm:h-32"
                            >
                                <Image
                                    src={src}
                                    alt="Gallery image"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Testimonials Slider */}
                <section className="p-4 space-y-4 text-center">
                    <h2 className="text-xl font-bold">Testimonials</h2>
                    <p className="italic max-w-md mx-auto">
                        &quot;{testimonials[testimonialIndex].text}&quot;
                    </p>
                    <p className="mt-2 font-semibold">
                        - {testimonials[testimonialIndex].name}
                    </p>
                </section>

                {/* FAQ Preview */}
                <section className="p-4 space-y-4 max-w-md mx-auto">
                    <h2 className="text-xl font-bold text-center">
                        Frequently Asked Questions
                    </h2>
                    <FAQAccordion items={faqs} />
                    <div className="text-center">
                        <Link href="/faq" className="underline">
                            View all FAQs
                        </Link>
                    </div>
                </section>

                {/* Contact Section with Map */}
                <section className="p-4 space-y-4">
                    <h2 className="text-xl font-bold text-center">Contact Us</h2>
                    <div className="flex flex-col items-center space-y-2">
                        <p>123 Salon Street, Beauty City</p>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509715!2d144.9537363159121!3d-37.81627974202154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d43f2b2f869%3A0x2e0b8816ba81e0f7!2sFederation%20Square!5e0!3m2!1sen!2sau!4v1615921308779!5m2!1sen!2sau"
                            className="w-full h-64 border-0"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </section>
            </div>
        </>
    );
}

