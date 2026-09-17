
import { memo, useState } from "react";
import { Link } from "react-router-dom";
import "./Content.css";

const slides = [
  {
    id: 1,
    title: "Learn smarter with guided projects",
    text: "Explore structured lessons, practical assignments, and mentor support built to move your skills forward every week.",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    badge: "Featured cohort",
  },
  {
    id: 2,
    title: "Upskill for real-world careers",
    text: "Build confidence with live sessions, hands-on exercises, and rich learning paths designed for modern teams.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    badge: "Career growth",
  },
  {
    id: 3,
    title: "Stay ahead with expert-led learning",
    text: "Access new topics, actionable insights, and personalized study plans that keep your development momentum strong.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
    badge: "New this week",
  },
];

function Content() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const showNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const showPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentSlide];

  return (
    <section className="hero-carousel" aria-label="Featured learning highlights">
      <div className="carousel-slide">
        <img src={activeSlide.image} alt={activeSlide.title} />

        <div className="carousel-overlay">
          <span className="carousel-badge">{activeSlide.badge}</span>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.text}</p>

          <div className="carousel-actions">
            <Link className="carousel-btn primary" to="/CoursesPage">Explore courses</Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="carousel-arrow prev"
        aria-label="Previous slide"
        onClick={showPrevSlide}
      >
        ‹
      </button>

      <button
        type="button"
        className="carousel-arrow next"
        aria-label="Next slide"
        onClick={showNextSlide}
      >
        ›
      </button>

      <div className="carousel-dots" aria-label="Slide pagination">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`carousel-dot ${index === currentSlide ? "active" : ""}`}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(Content);
