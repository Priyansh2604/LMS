import "./About.css";

function About() {
   return (
      <main className="about-page">
         <section className="about-hero">
            <div>
               <p className="about-eyebrow">THE LEARNLY APPROACH</p>
               <h1>Learning should feel like progress.</h1>
               <p className="about-lead">
                  Learnly brings focused lessons, practical projects, and clear paths
                  together so anyone can build skills that last.
               </p>
            </div>
            <div className="about-hero-mark" aria-hidden="true">L</div>
         </section>

         <section className="about-story" aria-labelledby="about-story-title">
            <div>
               <p className="about-eyebrow">WHY WE EXIST</p>
               <h2 id="about-story-title">Less noise. More meaningful learning.</h2>
            </div>
            <div className="about-story-copy">
               <p>
                  The modern tech landscape changes quickly, but learning does not
                  have to be overwhelming. Learnly helps turn big ambitions into
                  clear, achievable steps.
               </p>
               <p>
                  Every course is built around useful skills, real examples, and the
                  confidence to apply what you learn beyond the classroom.
               </p>
            </div>
         </section>

         <section className="about-highlights" aria-label="Learnly highlights">
            <div><strong>12+</strong><span>Learning paths</span></div>
            <div><strong>40 hrs</strong><span>Practical content</span></div>
            <div><strong>1 goal</strong><span>Your next step</span></div>
         </section>

         <section className="about-values" aria-labelledby="about-values-title">
            <div className="about-values-heading">
               <p className="about-eyebrow">WHAT GUIDES US</p>
               <h2 id="about-values-title">Made for curious people.</h2>
            </div>
            <div className="value-list">
               <article>
                  <span>01</span>
                  <h3>Clarity first</h3>
                  <p>Simple explanations and focused paths keep your attention on what matters.</p>
               </article>
               <article>
                  <span>02</span>
                  <h3>Practice over theory</h3>
                  <p>Build, test, and apply new ideas through useful hands-on work.</p>
               </article>
               <article>
                  <span>03</span>
                  <h3>Progress together</h3>
                  <p>Learn at your pace with a platform designed to make momentum visible.</p>
               </article>
            </div>
         </section>
      </main>
   );
}

export default About;