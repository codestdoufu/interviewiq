import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const HOW_IT_WORKS_STEPS = [
  {
    icon: '▸',
    title: 'Choose your role',
    body: 'Enter your target job and company. Our AI tailors every question specifically for you.',
  },
  {
    icon: '◉',
    title: 'Answer 5 questions',
    body: 'Respond to realistic interview questions with a built-in timer and instant AI scoring.',
  },
  {
    icon: '◆',
    title: 'Get your report',
    body: 'Receive a detailed performance report with strengths, focus areas, and a personalized improvement plan.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Got my Google internship after 2 weeks of practicing with InterviewIQ. The feedback is brutally honest.',
    author: 'Sarah K., CS Junior',
    initials: 'SK',
  },
  {
    quote:
      'Finally an interview tool that actually simulates real company questions. Meta questions hit different.',
    author: 'James L., Senior @ UC Berkeley',
    initials: 'JL',
  },
  {
    quote:
      'The STAR format coaching for behavioral interviews is insane. Went from 4/10 to 8/10 average in 3 days.',
    author: 'Priya M., Business Major',
    initials: 'PM',
  },
];

function LandingPage({ onLaunchApp }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToHowItWorks = () => {
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-page">
      <header className={`landing-nav ${isScrolled ? 'landing-nav-scrolled' : ''}`}>
        <div className="landing-brand">InterviewIQ</div>
        <button type="button" className="button-outline landing-launch-btn" onClick={onLaunchApp}>
          Launch App
        </button>
      </header>

      <section className="landing-hero">
        <div className="hero-floating-card hero-float-one card fade-up" style={{ animationDelay: '0s' }}>
          Score: 8/10 | Strong answer structure
        </div>
        <div
          className="hero-floating-card hero-float-two card fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          Improve: Add measurable impact details
        </div>

        <div className="hero-content">
          <p className="hero-badge">✦ AI-Powered Interview Coach</p>
          <h1>
            <span>Ace your next interview.</span>
            <span className="gradient-text">Practice with AI.</span>
          </h1>
          <p className="hero-subheading">
            Get personalized mock interviews tailored to your exact role and company. Real
            questions. Honest feedback. No fluff.
          </p>

          <div className="hero-actions">
            <button type="button" className="button-primary hero-primary" onClick={onLaunchApp}>
              Start practicing free
            </button>
            <button type="button" className="button-ghost hero-secondary" onClick={scrollToHowItWorks}>
              See how it works
            </button>
          </div>

          <p className="hero-proof">✦ Used by students at 50+ universities</p>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <h2 className="section-heading">Land the job in 3 steps</h2>
        <div className="landing-grid landing-steps-grid">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article
              key={step.title}
              className="card landing-card landing-step-card fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="landing-step-icon" aria-hidden="true">
                {step.icon}
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="section-heading">What students are saying</h2>
        <div className="landing-grid testimonials-grid">
          {TESTIMONIALS.map((testimonial, index) => (
            <article
              key={testimonial.author}
              className="card landing-card testimonial-card fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="testimonial-header">
                <div className="testimonial-avatar" aria-hidden="true">
                  {testimonial.initials}
                </div>
                <div className="testimonial-stars" aria-label="5 star rating">
                  <span>★★★★★</span>
                </div>
              </div>
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <p className="testimonial-author">- {testimonial.author}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">InterviewIQ</div>
        <p>Built for students, by students. Powered by OpenAI.</p>
        <p>© 2026 InterviewIQ</p>
      </footer>
    </div>
  );
}

LandingPage.propTypes = {
  onLaunchApp: PropTypes.func.isRequired,
};

export default LandingPage;
