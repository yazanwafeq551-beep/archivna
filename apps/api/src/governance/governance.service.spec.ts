import { workflowTarget } from './governance.service';

describe('archival workflow', () => {
  it('enforces the complete editorial path', () => {
    expect(workflowTarget('draft', 'submit')).toBe('processing');
    expect(workflowTarget('processing', 'start_cataloging')).toBe('cataloging');
    expect(workflowTarget('cataloging', 'request_review')).toBe('in_review');
    expect(workflowTarget('in_review', 'approve')).toBe('approved');
    expect(workflowTarget('approved', 'publish')).toBe('published');
  });

  it('rejects direct publication and unknown transitions', () => {
    expect(workflowTarget('draft', 'publish')).toBeNull();
    expect(workflowTarget('processing', 'approve')).toBeNull();
    expect(workflowTarget('published', 'submit')).toBeNull();
  });

  it('allows review stages to return records for changes', () => {
    expect(workflowTarget('processing', 'return_changes')).toBe('draft');
    expect(workflowTarget('cataloging', 'return_changes')).toBe('draft');
    expect(workflowTarget('in_review', 'return_changes')).toBe('draft');
    expect(workflowTarget('approved', 'return_changes')).toBe('draft');
  });
});
