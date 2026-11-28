class Competency {
  const Competency(this.name, this.mockQuota);

  final String name;
  final int mockQuota;
}

// Team Blueprint v3.3, section 3A. Preview only, not server identifiers.
const nsctCompetencies = [
  Competency('Problem Solving and Analytical Skills', 20),
  Competency('Programming (C++/Java/Python)', 10),
  Competency('Data Structures & Algorithms', 10),
  Competency('Software Engineering', 10),
  Competency('Web Development', 10),
  Competency('Databases', 10),
  Competency('Computer Networks & Cloud Computing', 10),
  Competency('AI / Machine Learning & Data Analytics', 10),
  Competency('Operating Systems', 5),
  Competency('Cyber Security', 5),
];
