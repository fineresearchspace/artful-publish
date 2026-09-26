# CFA Exam blog section

## What will be added
- Add **CFA Exam** beside **Articles** in the main navigation and footer.
- Create a dedicated `/cfa-exam` blog page with an introductory guide to the CFA journey and a list of published CFA Exam posts.
- Keep the section focused: only articles assigned to the **CFA Exam** category will appear there.
- Add **CFA Exam** to the writing studio’s category list so future posts can be created and published into this section.
- Include useful empty and unavailable states until the first CFA article is published.

## Page content
- Explain the basics a new candidate needs: exam levels, eligibility/planning, curriculum, study approach, registration and exam-day preparation.
- Present these as clear topic areas, while the actual blog feed is populated from published CFA Exam articles.
- Add page-specific search and social metadata.

## Technical details
- Seed the category safely with an idempotent database migration.
- Add a public query that returns only published articles whose category is `CFA Exam`.
- Create the new TanStack route and add its typed navigation link.
- Verify the page on desktop and mobile and confirm the app remains healthy.
