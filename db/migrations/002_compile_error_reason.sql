-- A submission that does not compile cannot be judged by the model, so its
-- semantic constraints are stored as `unsure` with the reason `compile_error`.
-- Widen the CHECK on verdicts.unsure_reason; existing rows stay valid.
ALTER TABLE verdicts DROP CONSTRAINT verdicts_unsure_reason_check;
ALTER TABLE verdicts ADD CONSTRAINT verdicts_unsure_reason_check
  CHECK (unsure_reason IN (
    'model_unsure', 'schema_invalid', 'evidence_mismatch',
    'timeout', 'cost_cap', 'hard_rule_unsure', 'compile_error'));
