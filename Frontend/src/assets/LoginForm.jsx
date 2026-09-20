import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./LoginForm.css";

const initialForm = {
	name: "",
	email: "",
	password: "",
	courseInterest: "",
	city: "",
	location: "",
	role: "learner",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getStoredUser() {
	try {
		const savedUser = localStorage.getItem("learnlyUser");
		if (!savedUser) return null;

		const parsedUser = JSON.parse(savedUser);
		return parsedUser && typeof parsedUser === "object" ? parsedUser : null;
	} catch {
		return null;
	}
}

function LoginForm() {
	const [mode, setMode] = useState("signup");
	const [form, setForm] = useState(initialForm);
	const [requestState, setRequestState] = useState({ status: "idle", message: "" });
	const navigate = useNavigate();
	const location = useLocation();
	const isSignup = mode === "signup";
	const isLoading = requestState.status === "loading";

	useEffect(() => {
		const currentUser = getStoredUser();
		if (currentUser?.id || currentUser?.email) {
			navigate(location.state?.from || "/", { replace: true });
		}
	}, [navigate, location.state?.from]);

	function updateField(event) {
		const { name, value } = event.target;
		setForm((currentForm) => ({ ...currentForm, [name]: value }));
		setRequestState({ status: "idle", message: "" });
	}

	function changeMode(nextMode) {
		setMode(nextMode);
		setRequestState({ status: "idle", message: "" });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setRequestState({ status: "loading", message: "" });

		const endpoint = isSignup ? "/api/auth/register" : "/api/auth/login";
		const payload = isSignup
			? { ...form, role: form.role || "learner" }
			: { email: form.email, password: form.password, role: form.role || "learner" };

		try {
			const response = await fetch(`${API_URL}${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Something went wrong. Please try again.");
			}

			const authUser = result?.user && typeof result.user === "object" ? result.user : null;
			if (!authUser) {
				throw new Error("The server did not return a valid user profile.");
			}

			localStorage.setItem("learnlyUser", JSON.stringify(authUser));
			window.dispatchEvent(new Event("learnly-auth-change"));
			setRequestState({ status: "success", message: result.message });
			const destination = location.state?.from || "/";
			navigate(destination, { replace: true });
		} catch (error) {
			setRequestState({
				status: "error",
				message: error.message || "Unable to connect to the Learnly API.",
			});
		}
	}

	return (
		<main className="auth-page">
			<section className="auth-intro" aria-labelledby="auth-title">
				<p className="auth-eyebrow">YOUR NEXT CHAPTER</p>
				<h1 id="auth-title">Make room for better learning.</h1>
				<p className="auth-description">
					Create your Learnly profile and we&apos;ll shape a learning path around
					what you want to do next.
				</p>
				<div className="auth-note">
					<span className="auth-note-mark">+</span>
					<span>Save your progress across every course and device.</span>
				</div>
			</section>

			<section className="auth-panel" aria-label="Authentication form">
				<div className="auth-tabs" role="tablist" aria-label="Authentication mode">
					<button
						type="button"
						className={isSignup ? "is-active" : ""}
						onClick={() => changeMode("signup")}
						role="tab"
						aria-selected={isSignup}
					>
						Create account
					</button>
					<button
						type="button"
						className={!isSignup ? "is-active" : ""}
						onClick={() => changeMode("signin")}
						role="tab"
						aria-selected={!isSignup}
					>
						Sign in
					</button>
				</div>

				{isSignup && (
					<label className="field field-wide">
						<span>Login as</span>
						<select name="role" value={form.role} onChange={updateField} required>
							<option value="learner">Learner</option>
							<option value="instructor">Instructor</option>
						</select>
					</label>
				)}

				{!isSignup && (
					<label className="field field-wide">
						<span>Login as</span>
						<select name="role" value={form.role} onChange={updateField} required>
							<option value="learner">Learner</option>
							<option value="instructor">Instructor</option>
						</select>
					</label>
				)}

				<div className="auth-heading">
					<p className="auth-panel-kicker">{isSignup ? "WELCOME IN" : "GOOD TO SEE YOU"}</p>
					<h2>{isSignup ? "Start with your profile" : "Pick up where you left off"}</h2>
					<p>{isSignup ? "A few details help us make your first steps count." : "Enter your details to continue learning."}</p>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					{isSignup && (
						<label className="field field-wide">
							<span>Full name</span>
							<input name="name" value={form.name} onChange={updateField} placeholder="e.g. Priyansh Sharma" required />
						</label>
					)}

					<label className="field">
						<span>Email address</span>
						<input type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
					</label>
					<label className="field">
						<span>Password</span>
						<input type="password" name="password" value={form.password} onChange={updateField} placeholder="At least 8 characters" minLength="8" required />
					</label>

					{isSignup && (
						<>
							<label className="field field-wide">
								<span>Interested topics</span>
								<select name="courseInterest" value={form.courseInterest} onChange={updateField} required>
									<option value="" disabled>Choose a learning path</option>
									<option>AI &amp; Machine Learning</option>
									<option>Cybersecurity</option>
									<option>Data Analytics</option>
									<option>Development</option>
									<option>Cloud &amp; DevOps</option>
								</select>
							</label>
							<label className="field">
								<span>City</span>
								<input name="city" value={form.city} onChange={updateField} placeholder="e.g. Bengaluru" required />
							</label>
							<label className="field">
								<span>Country / location</span>
								<input name="location" value={form.location} onChange={updateField} placeholder="e.g. India" required />
							</label>
						</>
					)}

					<button className="auth-submit" type="submit" disabled={isLoading}>
						{isLoading ? "Connecting..." : isSignup ? "Create my account" : "Sign in to Learnly"}
						<span aria-hidden="true">-&gt;</span>
					</button>
					{requestState.message && (
						<p className={`auth-feedback auth-feedback-${requestState.status}`} role="status">
							{requestState.message}
						</p>
					)}
				</form>

				<p className="auth-footer-copy">
					By continuing, you agree to our terms. <Link to="/">Back to home</Link>
				</p>
			</section>
		</main>
	);
}

export default LoginForm;
