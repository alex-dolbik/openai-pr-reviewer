import {type Inputs} from './inputs'

export class Prompts {
  summarize: string
  summarizeReleaseNotes: string

  summarizeFileDiff = `## GitHub PR Title

\`$title\` 

## Description

\`\`\`
$description
\`\`\`

## Diff

\`\`\`diff
$file_diff
\`\`\`

## Instructions for you

I would like you to summarize the diff within 50 words.
`
  triageFileDiff = `Below the summary, I would also like you to triage the diff as \`NEEDS_REVIEW\` or 
\`APPROVED\` based on the following criteria:

- If the diff involves any modifications to the logic or functionality, even if they 
  seem minor, triage it as \`NEEDS_REVIEW\`. This includes changes to control structures, 
  function calls, or variable assignments that might impact the behavior of the code.
- If the diff only contains very minor changes that don't affect the code logic, such as 
  fixing typos, formatting, or renaming variables for clarity, triage it as \`APPROVED\`.

Please evaluate the diff thoroughly and take into account factors such as the number of 
lines changed, the potential impact on the overall system, and the likelihood of 
introducing new bugs or security vulnerabilities. 
When in doubt, always err on the side of caution and triage the diff as \`NEEDS_REVIEW\`.

You must follow the format below strictly for triaging the diff and 
do not add any additional text in your response:
[TRIAGE]: <NEEDS_REVIEW or APPROVED>
`
  summarizeChangesets = `Provided below are changesets in this pull request. Changesets 
are in chronlogical order and new changesets are appended to the
end of the list. The format consists of filename(s) and the summary 
of changes for those files. There is a separator between each changeset.
Your task is to de-deduplicate and group together files with
related/similar changes into a single changeset. Respond with the updated 
changesets using the same format as the input. 

$raw_summary
`

  summarizePrefix = `Here is the summary of changes you have generated for files:
      \`\`\`
      $raw_summary
      \`\`\`

`

  summarizeShort = `Your task is to provide a concise summary of the changes 
and the goal of this PR. This summary will be used as a prompt while reviewing each 
file and must be very clear for the AI bot to understand. The summary should not 
exceed 250 words.
`

  reviewFileDiff = `
## How to parse the changes

Each file diff starts with ---new_hunk---
This is git diff which you need to review and provide reasonable comments

## How you must respond

- Don't return any additional text, return only response in JSON format
- Response should be an array of object which contains "file" as filename and comments array which is
array of object with "line" and "comment", where "line" is a line number to which you leave a comment
and "comment" field is a text of your comment
Here is an example:

    [{
      "file": {filename}
      "comments": [
         {
              "line": {line_number},
              "comment": {your_comment}
         },
      ] 
    }]

- Use Markdown format for review comment text and fenced code blocks for
  code snippets. Do not annotate code snippets with line numbers.
- If needed, provide replacement code suggestions to fix the issue by using 
  fenced code blocks with the \`suggestion\` as the language identifier. The
  line number range must map exactly to the range (inclusive) that needs to
  be replaced within a new hunk. For instance, if 2 lines of code in a hunk
  need to be replaced with 15 lines of code, the line number range must be
  those exact 2 lines. If an entire hunk need to be replaced with new code,
  then the line number range must be the entire hunk and the new code must
  exactly replace all the lines in the hunk.
- Replacement suggestions should be complete, correctly formatted and without
  the line number annotations. Each suggestion must be provided as a separate
  review section with relevant line number ranges.
- If needed, suggest new code snippets using the correct language identifier in the
  fenced code blocks. These snippets may be added to a different file
  (e.g. test cases), or within the same file at locations outside the provided
  hunks. Multiple new code snippets are allowed within a single review section.
- If there are no substantive issues detected at a line range and/or the
  implementation looks good, leave "comments" section empty 
- Reflect on your comments and line number ranges before sending the final
  response to ensure accuracy of line number ranges and replacement snippets.

### Response format expected

  [{
    "file": {filename}
    "comments": [
       {
            "line": {line_number},
            "comment": {your_comment}
       },
    ] 
  }]

## Changes made to \`$filename\` for your review

$patches
`

  comment = `A comment was made on a GitHub PR review for a 
diff hunk on a file - \`$filename\`. I would like you to follow 
the instructions in that comment. 

## GitHub PR Title

\`$title\`

## Description

\`\`\`
$description
\`\`\`

## Summary generated by the AI bot

\`\`\`
$short_summary
\`\`\`

## Entire diff

\`\`\`diff
$file_diff
\`\`\`

## Diff being commented on

\`\`\`diff
$diff
\`\`\`

## Instructions for you

Please reply directly to the new comment (instead of suggesting 
a reply) and your reply will be posted as-is.

If the comment contains instructions/requests for you, please comply. 
For example, if the comment is asking you to generate documentation 
comments on the code, in your reply please generate the required code.

In your reply, please make sure to begin the reply by tagging the user 
with "@user".

## Comment format

\`user: comment\`

## Comment chain (including the new comment)

\`\`\`
$comment_chain
\`\`\`

## The comment/request that you need to directly reply to

\`\`\`
$comment
\`\`\`
`

  constructor(summarize = '', summarizeReleaseNotes = '') {
    this.summarize = summarize
    this.summarizeReleaseNotes = summarizeReleaseNotes
  }

  renderSummarizeFileDiff(
    inputs: Inputs,
    reviewSimpleChanges: boolean
  ): string {
    let prompt = this.summarizeFileDiff
    if (reviewSimpleChanges === false) {
      prompt += this.triageFileDiff
    }
    return inputs.render(prompt)
  }

  renderSummarizeChangesets(inputs: Inputs): string {
    return inputs.render(this.summarizeChangesets)
  }

  renderSummarize(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarize
    return inputs.render(prompt)
  }

  renderSummarizeShort(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarizeShort
    return inputs.render(prompt)
  }

  renderSummarizeReleaseNotes(inputs: Inputs): string {
    const prompt = this.summarizePrefix + this.summarizeReleaseNotes
    return inputs.render(prompt)
  }

  renderComment(inputs: Inputs): string {
    return inputs.render(this.comment)
  }

  renderReviewFileDiff(inputs: Inputs): string {
    return inputs.render(this.reviewFileDiff)
  }
}
