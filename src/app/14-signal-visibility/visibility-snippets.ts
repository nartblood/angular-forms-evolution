export const SIGNAL_VISIBILITY_RULES = `hidden(path.firstComment, {
  when: ({ valueOf }) => !supportsFirstComment(valueOf(path.channels)),
});

// A hidden field still validates when visible.
required(path.firstComment, {
  when: ({ valueOf }) => valueOf(path.channels).includes('instagram'),
  message: 'Instagram posts need a first comment for hashtags',
});

disabled(path.scheduledAt, {
  when: ({ valueOf }) => valueOf(path.publishMode) !== 'scheduled',
});`;

export const SIGNAL_VISIBILITY_TEMPLATE = `<!-- Ask the field whether it should be rendered. -->
@if (!composer.firstComment().hidden()) {
  <ap-form-field>
    <label for="s5-firstComment">First comment</label>
    <input id="s5-firstComment" apInput [formField]="composer.firstComment" />`;
