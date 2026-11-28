enum Exam {
  nsct('NSCT', 'National Skill Competency Test'),
  mdcat('MDCAT', 'Medical and Dental College Admission Test'),
  nat('NAT-IE', 'National Aptitude Test — Pre-Engineering'),
  ielts('IELTS', 'Academic Reading');

  const Exam(this.label, this.description);

  final String label;
  final String description;
}
