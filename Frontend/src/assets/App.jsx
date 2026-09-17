
import Header from "./Header";
import Content from "./Content";
import Cards from "./Cards";
import Courses from "./Courses";
import About from "./About";
import AboutTopics from "./About topics";
import CoursesPage from "./CoursesPage";
import Coursecontent from "./Coursecontent";
import Quiz from "./Quiz.jsx";
import Footer from "./Footer";
import LoginForm from "./LoginForm";
import RequireAuth from "./RequireAuth";
import StartLearning from "./StartLearning";
import InstructorAdmin from "./InstructorAdmin";
import RequireInstructor from "./RequireInstructor";
import Account from "./Account";
import SkillPassport from "./SkillPassport";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  const [theme, setTheme] = useState("dark");

  return (
    <BrowserRouter>
      <div className={`app-shell ${theme === "light" ? "theme-light" : "theme-dark"}`}>
        <Header theme={theme} setTheme={setTheme} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Content theme={theme} setTheme={setTheme} />
                <h1>Explore different learning paths</h1>
                <div className="learning-paths">
                  <div className="cards-container">
                    <Cards
                      cardTitle="AI & Machine Learning"
                      cardDescription="Learn about emerging field of AI and ML and its applications."
                    />
                    <Cards
                      cardTitle="Cyber security"
                      cardDescription="Learn about protecting digital systems from threats."
                    />
                    <Cards
                      cardTitle="Data Analytics"
                      cardDescription="Analyze data to make informed business decisions."
                    />
                    <Cards
                      cardTitle="IOT"
                      cardDescription="Learn about the Internet of Things and its applications."
                    />
                  </div>
                </div>
                <h1>Explore top rated course on different skills</h1>
                <Courses />
              </>
            }
          />
          <Route path="/AboutPage" element={<About />} />
          <Route path="/AboutTopics/:topicName" element={<AboutTopics />} />
          <Route path="/AboutTopics" element={<AboutTopics />} />
          <Route path="/CoursesPage" element={<CoursesPage />} />
          <Route path="/QuizPage" element={<Quiz />} />
          <Route
            path="/InstructorAdmin"
            element={
              <RequireInstructor>
                <InstructorAdmin />
              </RequireInstructor>
            }
          />
          <Route
            path="/Coursecontent/:courseId"
            element={
              <RequireAuth>
                <Coursecontent />
              </RequireAuth>
            }
          />
          <Route
            path="/StartLearning/:courseId"
            element={
              <RequireAuth>
                <StartLearning />
              </RequireAuth>
            }
          />
          <Route path="/Login" element={<LoginForm />} />
          <Route
            path="/Account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="/SkillPassport"
            element={
              <RequireAuth>
                <SkillPassport />
              </RequireAuth>
            }
          />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
