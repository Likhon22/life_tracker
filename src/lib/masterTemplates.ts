export const masterTemplateWithoutExperience = String.raw`%-----------------------------------------------------------------------------------------------------------------------------------------------%
% The MIT License (MIT)
%-----------------------------------------------------------------------------------------------------------------------------------------------%

\documentclass[a4paper,12pt]{article}

\usepackage{url}
\usepackage{parskip}
\RequirePackage{color}
\RequirePackage{graphicx}
\usepackage[usenames,dvipsnames]{xcolor}
\usepackage[scale=0.9, top=0.5in, bottom=0.5in, left=0.6in, right=0.6in]{geometry}
\usepackage{tabularx}
\usepackage{enumitem}
\newcolumntype{C}{>{\centering\arraybackslash}X}
\usepackage{titlesec}
\titleformat{\section}{\Large\scshape\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{10pt}{4pt}
\usepackage[unicode, draft=false]{hyperref}
\definecolor{linkcolour}{rgb}{0,0.2,0.6}
\hypersetup{colorlinks,breaklinks,urlcolor=linkcolour,linkcolor=linkcolour}
\usepackage{fontawesome5}

\begin{document}
\pagestyle{empty}

%----------------------------------------------------------------------------------------
% TITLE
%----------------------------------------------------------------------------------------

\begin{tabularx}{\linewidth}{@{} C @{} }
    \Huge{Main Uddin Sarker} \\[6pt]
    \small
    \href{mailto:likhonsarker793@gmail.com}{\raisebox{-0.05\height}{\faEnvelope} \, likhonsarker793@gmail.com} \ $|$ \
    \href{https://www.likhonsarker.xyz}{\raisebox{-0.05\height}{\faGlobe} \, Portfolio} \ $|$ \
    \href{https://github.com/Likhon22}{\raisebox{-0.05\height}{\faGithub} \, GitHub} \ $|$ \
    \href{https://www.linkedin.com/in/likhon-sarker-78395a336}{\raisebox{-0.05\height}{\faLinkedin} \, LinkedIn} \\
    Dhaka, Bangladesh \ $|$ \, Bangla (Native), English
\end{tabularx}

%----------------------------------------------------------------------------------------
% SUMMARY
%----------------------------------------------------------------------------------------

\section{Summary}
Backend-focused Software Engineer specializing in \textbf{Go} and building scalable microservices, REST APIs, and distributed systems. Experienced in \textbf{PostgreSQL, MongoDB, Redis, Docker, gRPC, Kong API Gateway} with secure authentication. Complementary skills in \textbf{Node.js, Express.js, TypeScript} for service integration.

%----------------------------------------------------------------------------------------
% SKILLS
%----------------------------------------------------------------------------------------

\section{Technical Skills}
\renewcommand{\arraystretch}{1.1} 
\begin{tabularx}{\linewidth}{@{}l X@{}}
\textbf{Languages} & Go, TypeScript, JavaScript \\
\textbf{Backend} & REST APIs, gRPC, Microservices, Kong API Gateway, Node.js, Express.js \\
\textbf{Databases} & PostgreSQL, MongoDB, Redis, DynamoDB \\
\textbf{Tools / Libraries} & Docker, chi router, Zerolog, Zap, bcrypt, go-playground/validator, Lua (Kong plugin) \\
\textbf{Concepts} & JWT Authentication, Clean Architecture, Layered Design, Structured Logging, Caching, Middleware \\
\end{tabularx}
\renewcommand{\arraystretch}{1} 

%----------------------------------------------------------------------------------------
% PROJECTS
%----------------------------------------------------------------------------------------

\section{Selected Projects}
\begin{itemize}[leftmargin=0.5cm, label={}, itemsep=1pt]

    \item \textbf{E-Commerce Microservices — Go + TypeScript, Kong API Gateway}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0.5pt, parsep=0pt]
        \item Developed microservices backend: Auth, Product, Cart (\textbf{Go}) and User Service (\textbf{Node.js + Express.js, TS}) with layered architecture.
        \item Implemented JWT authentication, gRPC communication, Redis caching, and product/cart persistence.
        \item Built Kong API Gateway with custom Lua plugins for auth and JSON→gRPC translation.
    \end{itemize}

    \vspace{2pt}

    \item \textbf{Social Media Platform API — Go, PostgreSQL, Docker}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0.5pt, parsep=0pt]
        \item Designed modular REST API using \textbf{Go} and chi router for Users, Posts, Comments, Feeds, Followers.
        \item Added JWT authentication, secure password handling (bcrypt), and Redis caching for feeds.
        \item Optimized PostgreSQL queries and pagination for performance.
    \end{itemize}

    \vspace{2pt}

    \item \textbf{School Management System API — Go, PostgreSQL}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0.5pt, parsep=0pt]
        \item Built RESTful API with clean architecture (Handler → Service → Repository).
        \item Implemented JWT auth, rate limiting, gzip compression, and structured logging.
        \item Optimized DB pooling and secure password management (bcrypt).
    \end{itemize}

\end{itemize}

%----------------------------------------------------------------------------------------
% EDUCATION
%----------------------------------------------------------------------------------------

\section{Education}
\renewcommand{\arraystretch}{1.1} 
\begin{tabularx}{\linewidth}{@{}X@{}}
\textbf{Bachelor of Science in Computer Science and Engineering}, United International University (UIU) \\
\textbf{CGPA:} 3.56 / 4.00 \\
July 2021 -- October 2025 \\
\end{tabularx}
\renewcommand{\arraystretch}{1} 

%----------------------------------------------------------------------------------------
% INTERESTS
%----------------------------------------------------------------------------------------

\section{Interests}
Backend system design, Microservices, Reading tech blogs

\end{document}
`;

export const masterTemplateWithExperience = String.raw`%-----------------------------------------------------------------------------------------------------------------------------------------------%
% The MIT License (MIT)
%-----------------------------------------------------------------------------------------------------------------------------------------------%

\documentclass[a4paper,12pt]{article}

\usepackage{url}
\usepackage{parskip}
\RequirePackage{color}
\RequirePackage{graphicx}
\usepackage[usenames,dvipsnames]{xcolor}
\usepackage[scale=0.9, top=0.5in, bottom=0.5in, left=0.6in, right=0.6in]{geometry}
\usepackage{tabularx}
\usepackage{enumitem}
\newcolumntype{C}{>{\centering\arraybackslash}X}
\usepackage{titlesec}
\titleformat{\section}{\Large\scshape\raggedright}{}{0em}{}[\titlerule]
\titlespacing{\section}{0pt}{8pt}{4pt} % slightly reduced spacing
\usepackage[unicode, draft=false]{hyperref}
\definecolor{linkcolour}{rgb}{0,0.2,0.6}
\hypersetup{colorlinks,breaklinks,urlcolor=linkcolour,linkcolor=linkcolour}
\usepackage{fontawesome5}

\begin{document}
\pagestyle{empty}

%----------------------------------------------------------------------------------------
% TITLE
%----------------------------------------------------------------------------------------

\begin{tabularx}{\linewidth}{@{} C @{} }
    \Huge{Main Uddin Sarker Likhon} \\[5pt]
    \small
    \href{mailto:likhonsarker793@gmail.com}{\raisebox{-0.05\height}{\faEnvelope} \, likhonsarker793@gmail.com} \ $|$ \
    \href{https://www.likhonsarker.xyz}{\raisebox{-0.05\height}{\faGlobe} \, Portfolio} \ $|$ \
    \href{https://github.com/Likhon22}{\raisebox{-0.05\height}{\faGithub} \, GitHub} \ $|$ \
    \href{https://www.linkedin.com/in/likhon-sarker-78395a336}{\raisebox{-0.05\height}{\faLinkedin} \, LinkedIn} \\
    Dhaka, Bangladesh \ $|$ \, Bangla (Native), English
\end{tabularx}

%----------------------------------------------------------------------------------------
% SUMMARY
%----------------------------------------------------------------------------------------

\section{Summary}
Frontend-focused Full-stack Developer with expertise in \textbf{React, TypeScript, Redux, Next.js}, and modern UI frameworks (\textbf{Tailwind CSS, Shadcn UI}). Skilled in \textbf{GraphQL, REST APIs}, payment gateway integration (\textbf{Stripe, Firebase}), Docker, and CI/CD pipelines. Experienced in building responsive, scalable applications for fintech and AI-enhanced platforms.

%----------------------------------------------------------------------------------------
% SKILLS
%----------------------------------------------------------------------------------------

\section{Technical Skills}
\renewcommand{\arraystretch}{1.05} 
\begin{tabularx}{\linewidth}{@{}l X@{}}
\textbf{Languages} & JavaScript, TypeScript, Go \\
\textbf{Frontend} & React, Next.js, Redux, HTML, CSS, Tailwind CSS, Shadcn UI \\
\textbf{Backend} & Node.js, Express.js, REST \& GraphQL APIs, Authentication, Payment Integration \\
\textbf{Databases} & PostgreSQL, MongoDB, Prisma, Mongoose, Redis \\
\textbf{Tools/DevOps} & Docker, CI/CD, Vercel, Cloudinary, Nodemailer \\
\textbf{Concepts} & Clean Architecture, Code Modularity, State Management, Microservices Basics \\
\end{tabularx}
\renewcommand{\arraystretch}{1}

%----------------------------------------------------------------------------------------
% EXPERIENCE
%----------------------------------------------------------------------------------------

\section{Professional Experience}
\begin{itemize}[leftmargin=0.5cm, label={}, itemsep=1pt, parsep=0.5pt]
    \item \textbf{Independent / Freelance Developer} \hfill 2023 -- Present
    \begin{itemize}[leftmargin=0.55cm, itemsep=0pt, parsep=0pt]
        \item Built scalable frontend applications with React, TypeScript, Redux, Tailwind CSS, Shadcn UI.
        \item Developed full-stack apps using Node.js, Express.js, MongoDB, PostgreSQL, Docker, CI/CD pipelines.
        \item Integrated REST \& GraphQL APIs, authentication, and payment gateways (Stripe/Firebase).
        \item Delivered AI-enhanced platforms including QuickAI and AI E-Commerce.
    \end{itemize}
\end{itemize}

%----------------------------------------------------------------------------------------
% PROJECTS
%----------------------------------------------------------------------------------------

\section{Selected Projects}
\begin{itemize}[leftmargin=0.5cm, label={}, itemsep=1pt, parsep=0.5pt]

    \item \textbf{Car Washing System Frontend — React, TypeScript, Redux, TailwindCSS}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0pt, parsep=0pt]
        \item Modern, responsive frontend for car wash booking and admin management.
        \item User authentication, service browsing, booking system, and dashboard.
        \item Admin dashboard with service, slot, and user management.
        \item State management with Redux Toolkit and caching via RTK Query.
        \item Form validation with React Hook Form \& Zod; token refresh for smooth UX.
    \end{itemize}

    \vspace{5pt}

    \item \textbf{QuickAI — Next.js, Gemini, ClipDrop}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0pt, parsep=0pt]
        \item AI-powered content \& image platform using Gemini and ClipDrop APIs.
        \item Responsive Next.js frontend with optimized GraphQL/REST API routing.
    \end{itemize}

    \vspace{5pt}

    \item \textbf{AI E-Commerce — MERN + AI Product Assistant}
    \begin{itemize}[leftmargin=0.55cm, itemsep=0pt, parsep=0pt]
        \item Scalable e-commerce platform with AI-powered recommendations and auto descriptions.
        \item Implemented authentication, cart/order flow, and cloud image hosting.
    \end{itemize}

\end{itemize}

%----------------------------------------------------------------------------------------
% EDUCATION
%----------------------------------------------------------------------------------------

\section{Education}
\renewcommand{\arraystretch}{1.05} 
\begin{tabularx}{\linewidth}{@{}X@{}}
\textbf{Bachelor of Science in Computer Science and Engineering}, United International University (UIU) \\
\textbf{CGPA:} 3.56 / 4.00 \\
\textbf{Graduated:} October 2025 \\
\end{tabularx}
\renewcommand{\arraystretch}{1}

\end{document}
`;
