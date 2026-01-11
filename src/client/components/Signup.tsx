import React, { useState } from "react";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const stripPlusAlias = (email: string): string => {
  return email.split("@").map((part, index) => {
    if (index === 0) {
      return part.replace(/\+[a-zA-Z0-9_-]+$/, "");
    }
    return part;
  }).join("@");
};

const Signup = () => {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);

  const getDeviceOS = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (
      userAgent.includes("iOS") ||
      userAgent.includes("iPhone") ||
      userAgent.includes("iPad")
    )
      return "iOS";
    return "Unknown";
  };

  const getTrafficSource = (): string | undefined => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("ref") || undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setMessage("Please enter a valid email address");
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const normalizedEmail = stripPlusAlias(email.trim());
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          device: getDeviceOS(),
          traffic_source: getTrafficSource(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsError(false);
        setEmail("");
      } else {
        setMessage(data.error || "Failed to register. Please try again.");
        setIsError(true);
      }
    } catch (error) {
      setMessage("Network error. Please check your connection and try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="join">
      <div>
        <label className="input validator join-item">
          <svg
            className="h-[1em] opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <g
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2.5"
              fill="none"
              stroke="currentColor"
            >
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </g>
          </svg>
          <input
            className="w-48"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            type="email"
            placeholder="mail@site.com"
            required
            disabled={isLoading}
          />
        </label>
        {message && (
          <div
            className={`mt-2 text-center text-sm ${isError ? "text-red-500" : "text-green-500"}`}
          >
            {message}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="btn btn-accent join-item"
        disabled={isLoading}
      >
        {isLoading ? "Joining..." : "Join"}
      </button>
    </form>
  );
};

export default Signup;
