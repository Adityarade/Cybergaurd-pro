# Contributing Guidelines

Thank you for considering contributing to **CyberGuard Pro**! We strive to maintain a high‑quality, secure, and beautifully designed codebase.

## How to Contribute
1. **Fork the repository** and clone your fork.
2. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** following the project's coding style:
   - Use **Prettier** and **ESLint** for the frontend.
   - Use **Black** and **Flake8** for the backend (Python).
   - Follow the **airbnb** style for JavaScript/React.
4. **Write tests** for new functionality. Frontend uses Jest + React Testing Library; backend uses pytest.
5. **Run the test suite** locally:
   ```bash
   # Frontend
   cd frontend && npm run test
   # Backend
   cd backend && pytest
   ```
6. **Commit with a clear message** and push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
7. **Open a Pull Request** against `main` and fill the PR template.

## Code Review Process
- All PRs must pass CI checks (lint, type‑checking, tests).
- At least one reviewer must approve before merging.
- Ensure no security regressions (e.g., hard‑coded secrets, insecure headers).

## Style & Aesthetics
- Follow the project's **design system** (dark mode, neon gradients, glassmorphism).
- Prefer **functional components** with hooks.
- Keep UI components **reusable** and **well‑documented**.

## Reporting Issues
- Use the GitHub Issues tab.
- Include a clear description, reproduction steps, and any relevant logs.

---
*Happy hacking!*
