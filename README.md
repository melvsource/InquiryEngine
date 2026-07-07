# InquiryEngine

**InquiryEngine** is an AI-powered inquiry platform designed to help people investigate subjects with clarity, coherence, and intellectual integrity.

Unlike traditional AI assistants that primarily generate answers, InquiryEngine is built to guide an investigation toward discovering what is most likely to be true. Every report is structured to examine a subject from multiple perspectives, identify assumptions, distinguish evidence from opinion, and present findings in a clear and organized manner.

---

## Purpose

InquiryEngine exists to help users:

* Investigate complex subjects with greater clarity.
* Separate facts from assumptions.
* Organize information into a coherent understanding.
* Identify competing explanations.
* Encourage thoughtful decision-making rather than superficial conclusions.

The platform is designed for learners, professionals, researchers, educators, business leaders, and anyone seeking deeper understanding.

---

## Features

* AI-powered inquiry generation
* Structured investigation reports
* Clear sectioned presentation
* Evidence-oriented analysis
* Interactive web interface
* Secure API integration
* Responsive design
* Extensible architecture for future capabilities

---

## Project Structure

```text
/
├── app/
├── components/
├── lib/
├── public/
├── styles/
├── types/
├── package.json
└── README.md
```

---

## Technology Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Node.js
* InquiryEngine API

---

## Architecture

The public website serves as the presentation layer of the InquiryEngine ecosystem.

```text
User
    │
    ▼
InquiryEngine Website
    │
    ▼
InquiryEngine API
    │
    ▼
InquiryEngine-Core
    │
    ▼
Generated Inquiry Report
```

The website is intentionally lightweight. All investigative processing is performed by the backend engine, while the frontend is responsible for collecting user input, communicating with the API, and presenting the resulting inquiry report.

---

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

---

## Design Principles

InquiryEngine is developed around the following principles:

* Clarity over complexity
* Structured thinking over information overload
* Transparency over ambiguity
* Coherence over contradiction
* Evidence before conclusion
* Continuous refinement through inquiry

---

## Repository Purpose

This repository contains the public-facing website for InquiryEngine.

Its responsibilities include:

* User interface
* User experience
* API communication
* Report rendering
* Authentication (where applicable)
* Frontend assets and styling

The investigative engine itself is maintained separately within the private **InquiryEngine-Core** repository.

---

## Roadmap

Planned improvements include:

* User accounts
* Saved inquiry history
* Report export (PDF and Markdown)
* Searchable inquiry archive
* Shareable report links
* Advanced visualization
* Multi-language support
* Team workspaces
* Citation improvements
* Accessibility enhancements

---

## Contributing

Contributions that improve code quality, performance, maintainability, accessibility, testing, and documentation are welcome.

Please ensure all pull requests are focused, well-tested, and consistent with the project's architectural direction.

---

## License

Copyright © 2026. All rights reserved.

The InquiryEngine name, branding, investigative methodology, and associated intellectual property are proprietary. Unauthorized reproduction, redistribution, or commercial use of the underlying methodology is prohibited unless expressly authorized by the copyright holder.
