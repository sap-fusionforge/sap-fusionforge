-- SAP FusionForge | seed.sql | Initial data for Phase 0 S05

-- 7 agents (all start idle)
INSERT INTO agents (slug, name, type, phase, status) VALUES
  ('solution-architect',   'Solution Architect',    'pro-code', 1, 'idle'),
  ('business-analyst',     'Business Analyst',      'citizen',  1, 'idle'),
  ('discovery-advisor',    'Discovery Advisor',     'research', 1, 'idle'),
  ('cap-developer',        'CAP Developer',         'pro-code', 2, 'idle'),
  ('build-apps-developer', 'Build Apps Developer',  'low-code', 2, 'idle'),
  ('bpa-designer',         'BPA Designer',          'low-code', 2, 'idle'),
  ('btp-admin',            'BTP Admin',             'pro-code', 3, 'idle');

-- Sprint state (key-value)
INSERT INTO sprint_state (key, value) VALUES
  ('current_phase',  'discover'),
  ('phase_gate',     'open'),
  ('boot_completed', 'false');
