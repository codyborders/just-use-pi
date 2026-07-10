---
description: Review a rendered interface against frontend standards
argument-hint: "[URL, route, or screenshot context]"
---
Use the `frontend-design-review` skill to review the supplied screenshots or this target:

${1:-the frontend pages affected by the current changes}

Additional context: ${@:2}

Capture missing representative viewports when browser tooling and a live page are available. Return only the skill's valid JSON result.
