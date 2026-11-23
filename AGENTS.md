<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use one browser-persisted canonical store for all CRM entities; derive client summaries and views from it to avoid divergent fixed data.
- Parse workbooks in the browser, validate references against the chosen replacement/merge scope, and require review before saving.
- Keep demo sessions in sessionStorage and apply role-scoped reads and route gates centrally; this is not production authentication.
