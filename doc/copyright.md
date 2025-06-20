# 📄 Copyright / Legal Issues Report

This document outlines all third-party libraries, services, and media assets used in the Cycle project ([GitHub Repo](https://github.com/mzyy1001/Cycle)), along with their license types, usage purposes, and legal compliance requirements. This is important for potential public or commercial release of the app.

---

## Third-Party Resources and Licenses

| Resource Name / Description | Type of Resource | Source Link | License Type | Usage in Project | Legal Requirements |
|-----------------------------|------------------|-------------|--------------|------------------|---------------------|
| Expo (React Native) | Mobile App Framework | https://expo.dev | MIT License | Cross-platform mobile app development | Attribution not required |
| React Native | UI Framework | https://reactnative.dev | MIT License | UI design and mobile components | Attribution not required |
| Express.js | Backend Framework | https://expressjs.com | MIT License | RESTful API server | Attribution not required |
| SQLite | Database | https://www.sqlite.org | Public Domain | Local task & user data storage | No restrictions |
| Python | Programming Language | https://www.python.org | Python Software Foundation License | Backend scripting and logic | Attribution not required |
| OpenAI API | AI Service | https://openai.com/policies/terms-of-use | OpenAI Terms of Use (Proprietary) | GPT-powered AI task rescheduling and generation | Must comply with [OpenAI Usage Policy](https://openai.com/policies/usage-policies) |
| GPT-generated Images | Image Assets | Generated using OpenAI API | Subject to OpenAI Content Policy | Illustrations in app UI | Comply with OpenAI’s content ownership and usage rules |
| JWT (jsonwebtoken) | Auth Module | https://github.com/auth0/node-jsonwebtoken | MIT License | User authentication | Include license in distributions |
| Axios & Fetch | Networking Library | https://axios-http.com / native `fetch()` | MIT License / Native | Client-side API requests | Attribution not required |

---

## Legal Considerations for Official Release

- **OpenAI-Generated Content**  
  As per OpenAI’s terms of service, the generated content belongs to the user, provided it complies with their usage policy. No specific attribution is required unless redistribution of model outputs violates policies or includes sensitive content.

- **GDPR & UK Data Protection Compliance**  
  The app stores and manipulates user-authored tasks, which may qualify as personal data. Before public release:
  - Obtain explicit **user consent**;
  - Provide a clear **Privacy Policy**;
  - Minimize and secure data storage;
  - Ensure AI decisions are explainable and non-discriminatory.

- **Attribution Requirements**  
  While most open-source components (MIT, Public Domain, PSF) do not require attribution, including a license and credits section is best practice. OpenAI outputs should include disclaimers or usage clarifications where applicable.

- **OpenAI API Limits**  
  Confirm compliance with OpenAI’s quotas, rate limits, and commercial use policies when deploying beyond free tiers.

- **Future Licensing**  
  Consider including a project-wide license (e.g., MIT or Apache 2.0) and providing a `NOTICE` or `LICENSE` file detailing third-party libraries and their associated licenses.

---

_Last updated: June 2025_
