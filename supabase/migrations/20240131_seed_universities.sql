-- Seed data for Jamaican universities
BEGIN;

INSERT INTO public.universities (name, abbrev, domain, location) VALUES
  ('University of the West Indies, Mona', 'UWI Mona', 'mona.uwi.edu', 'Kingston'),
  ('University of Technology, Jamaica', 'UTech', 'utech.edu.jm', 'Kingston'),
  ('Northern Caribbean University', 'NCU', 'ncu.edu.jm', 'Mandeville'),
  ('University of the Commonwealth Caribbean', 'UCC', 'ucc.edu.jm', 'Kingston'),
  ('Caribbean Maritime University', 'CMU', 'cmu.edu.jm', 'Kingston'),
  ('Mico University College', 'Mico', 'themico.edu.jm', 'Kingston'),
  ('Edna Manley College of the Visual and Performing Arts', 'EMCVPA', 'ednamanleys.edu.jm', 'Kingston'),
  ('College of Agriculture, Science and Education', 'CASE', 'case.edu.jm', 'Portland')
ON CONFLICT DO NOTHING;

COMMIT;
