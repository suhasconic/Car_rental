import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: 'What is the security deposit amount?',
            answer: 'Security deposit varies by vehicle type. Hatchbacks require ₹5,000, Sedans ₹8,000-10,000, and SUVs/Luxury cars ₹12,000-15,000. The deposit is fully refundable after the car is returned in good condition.'
        },
        {
            question: 'What documents do I need to rent a car?',
            answer: 'You need a valid driving license (minimum 1 year old), government-issued ID proof (Aadhar/PAN/Passport), and address proof. For verification, we may also request a recent photograph.'
        },
        {
            question: 'Is insurance included in the rental price?',
            answer: 'Yes, all our vehicles come with comprehensive insurance coverage. However, any damages due to rash driving or negligence may affect your trust score and require additional payment.'
        },
        {
            question: 'What is the fuel policy?',
            answer: 'We follow a "Same-to-Same" fuel policy. You\'ll receive the car with a certain fuel level and should return it with the same level. Alternatively, you can opt for our fuel package at the time of booking.'
        },
        {
            question: 'Can I cancel or modify my booking?',
            answer: 'Yes, you can cancel up to 24 hours before pickup for a full refund. Cancellations within 24 hours incur a 50% charge. Modifications can be made up to 12 hours before pickup, subject to availability.'
        },
        {
            question: 'What are the speed limits and driving restrictions?',
            answer: 'Please adhere to local traffic rules. Rash driving, over-speeding, or traffic violations will negatively impact your trust score and may result in penalties. We monitor driving behavior for safety.'
        },
        {
            question: 'How does the trust score system work?',
            answer: 'Your trust score is calculated based on your ratings, number of rides, and driving behavior. High scores give you priority access to premium cars and better rates. Damage or rash driving reduces your score.'
        },
        {
            question: 'Do you offer delivery and pickup services?',
            answer: 'Yes, we offer doorstep delivery and pickup within city limits for an additional fee. Contact us for pricing and availability in your area.'
        }
    ];

    return (
        <section className="py-20 relative" id="faq">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Everything you need to know about renting with us
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="glass-card overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="text-white font-semibold pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-primary-400 flex-shrink-0 transition-transform duration-300 ${
                                        openIndex === index ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${
                                    openIndex === index ? 'max-h-96' : 'max-h-0'
                                }`}
                            >
                                <div className="px-6 pb-6 text-gray-400">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
