export const programDays = [
  {
    id: 'day-1',
    dayNumber: 'Day 1',
    label: 'DAY 1 · BOOTCAMP',
    date: 'September 7, 2026',
    title: 'Start with the fundamentals.',
    description:
      'A beginner-friendly deep dive into quantum computing, qubits, superposition, quantum circuits, and getting started with Qiskit.',
    link: '/day-1',
    sessions: [
      {
        id: 'day1-welcome',
        time: '09:00',
        title: 'Registration & Welcome',
        type: 'Orientation',
        description:
          'Welcome participants, check in, collect attendee kits, and kick off Qiskit Fall Fest 2026.',
        speaker: 'Organizing Team',
        location: 'Welcome Desk & Auditorium',
        duration: '60 min',
        points: [
          'Attendee check-in and welcome kits',
          'Festival orientation and opening remarks',
          'Overview of the 4-day learning arc',
        ],
      },
      {
        id: 'day1-fundamentals',
        time: '10:15',
        title: 'Quantum Computing Fundamentals',
        type: 'Lecture',
        description:
          'An intuitive introduction to quantum computing, qubits, superposition, and quantum measurement.',
        speaker: 'Quantum Faculty',
        location: 'Main Auditorium',
        duration: '75 min',
        points: [
          'Classical bits versus quantum qubits',
          'Understanding superposition and state vectors',
          'Measurement and quantum probability',
        ],
      },
      {
        id: 'day1-intro-qiskit',
        time: '11:45',
        title: 'Introduction to Qiskit',
        type: 'Talk & Walkthrough',
        description:
          'Get hands-on with the Qiskit SDK: installation, environment setup, and running your first quantum program.',
        speaker: 'Qiskit Advocate',
        location: 'Main Auditorium',
        duration: '60 min',
        points: [
          'Setting up Python, Jupyter, and Qiskit',
          'Creating QuantumCircuit objects and adding gates',
          'Executing circuits on statevector simulators',
        ],
      },
      {
        id: 'day1-circuits-workshop',
        time: '14:00',
        title: 'Quantum Circuits Bootcamp',
        type: 'Hands-on Workshop',
        description:
          'Interactive bootcamp session covering Bell states, entanglement circuits, and quantum logic gates.',
        speaker: 'Mentors & Leads',
        location: 'Quantum Lab Space',
        duration: '90 min',
        points: [
          'Multi-qubit systems and entanglement',
          'Building Hadamard and CNOT combinations',
          'Analyzing simulation results and Bloch spheres',
        ],
      },
      {
        id: 'day1-qa-practice',
        time: '16:00',
        title: 'Q&A / Practice Session',
        type: 'Practice & Q&A',
        description:
          'Open practice session with peer discussion, code debugging, and mentor office hours.',
        speaker: 'Bootcamp Mentors',
        location: 'Open Collaboration Area',
        duration: '60 min',
        points: [
          'Review key concepts and clarify doubts',
          'Guided coding exercises and self-paced labs',
          'Preparing for Day 2 Hackathon kickoff',
        ],
      },
    ],
  },
  {
    id: 'day-2',
    dayNumber: 'Day 2',
    label: 'DAY 2 · HACKATHON',
    date: 'September 8, 2026',
    title: 'Experiment and build.',
    description:
      'The hackathon begins. Form teams, brainstorm problem statements, start building quantum projects, and experiment with quantum algorithms.',
    link: '/day-2',
    sessions: [
      {
        id: 'day2-kickoff',
        time: '09:30',
        title: 'Hackathon Kickoff',
        type: 'Kickoff',
        description:
          'Official hackathon opening ceremony with problem statement releases, rules, and judging criteria.',
        speaker: 'Hackathon Leads',
        location: 'Main Auditorium',
        duration: '45 min',
        points: [
          'Challenge track announcements',
          'Rules, guidelines, and submission requirements',
          'Judging criteria and resource walkthrough',
        ],
      },
      {
        id: 'day2-qiskit-practice',
        time: '10:30',
        title: 'Qiskit Practice',
        type: 'Hands-on',
        description:
          'Targeted problem-solving drills with Qiskit algorithms and quantum circuit optimization tools.',
        speaker: 'Technical Mentors',
        location: 'Lab Station',
        duration: '60 min',
        points: [
          'Hands-on algorithm implementations',
          'Noise models and transpilation basics',
          'Working with Qiskit Runtime primitives',
        ],
      },
      {
        id: 'day2-team-ideation',
        time: '11:45',
        title: 'Team Formation & Ideation',
        type: 'Ideation',
        description:
          'Finalize your hackathon team, choose a problem statement, and brainstorm technical solutions.',
        speaker: 'Community Leads',
        location: 'Collaboration Hub',
        duration: '60 min',
        points: [
          'Team matching and role assignment',
          'Problem statement deep dive and scoping',
          'Architecture and algorithmic roadmap brainstorming',
        ],
      },
      {
        id: 'day2-project-dev',
        time: '14:00',
        title: 'Project Development',
        type: 'Hackathon',
        description:
          'Dedicated hacking sprint where teams write quantum code, test algorithms, and prototype applications.',
        speaker: 'Hacking Teams',
        location: 'Hacking Arena',
        duration: '120 min',
        points: [
          'Core circuit development in Qiskit',
          'Algorithm design and state preparation',
          'Integrating frontends or analysis scripts',
        ],
      },
      {
        id: 'day2-mentor-checkin',
        time: '16:30',
        title: 'Mentor / Team Check-in',
        type: 'Mentorship',
        description:
          'One-on-one progress review with industry mentors to evaluate project directions and unblock hurdles.',
        speaker: 'Industry Mentors',
        location: 'Mentor Stations',
        duration: '60 min',
        points: [
          'Feedback on technical feasibility and scope',
          'Circuit optimization and debugging guidance',
          'Action items for Day 3 sprint',
        ],
      },
    ],
  },
  {
    id: 'day-3',
    dayNumber: 'Day 3',
    label: 'DAY 3 · HACKATHON',
    date: 'September 9, 2026',
    title: 'Build, test, and collaborate.',
    description:
      'Intensive building day. Finalize project implementations, run circuits on quantum simulators, test code, collaborate with mentors, and prepare project showcase submissions.',
    link: '/day-3',
    sessions: [
      {
        id: 'day3-briefing',
        time: '09:30',
        title: 'Challenge Briefing',
        type: 'Briefing',
        description:
          'Morning standup highlighting milestone deadlines, evaluation rubrics, and submission procedures.',
        speaker: 'Hackathon Committee',
        location: 'Main Auditorium',
        duration: '30 min',
        points: [
          'Sprint timeline and milestone check-ins',
          'Submission portal requirements and test benchmarks',
          'Tips for effective project demonstrations',
        ],
      },
      {
        id: 'day3-build-test',
        time: '10:15',
        title: 'Build / Test Sprint',
        type: 'Hackathon',
        description:
          'Focused coding sprint executing circuits across quantum simulators and optimizing performance.',
        speaker: 'Teams & Mentors',
        location: 'Hacking Arena',
        duration: '105 min',
        points: [
          'Transpiling circuits for noise resilience',
          'Benchmarking algorithm accuracy and depth',
          'Iterating on prototype features',
        ],
      },
      {
        id: 'day3-community-showcase',
        time: '13:00',
        title: 'Community Showcase',
        type: 'Community',
        description:
          'Informal peer exchange where teams showcase work-in-progress, test peer tools, and exchange feedback.',
        speaker: 'Participating Teams',
        location: 'Community Stage',
        duration: '60 min',
        points: [
          'Peer demos and lightning feedback',
          'Collaborative cross-team problem solving',
          'Testing usability and presentation flows',
        ],
      },
      {
        id: 'day3-project-dev-testing',
        time: '14:15',
        title: 'Project Development & Testing',
        type: 'Hackathon',
        description:
          'Final development sprint polishing quantum code, running validation tests, and completing documentation.',
        speaker: 'Hacking Teams',
        location: 'Hacking Arena',
        duration: '120 min',
        points: [
          'End-to-end integration and code cleanup',
          'Writing clean README and documentation',
          'Validating simulation outputs and visuals',
        ],
      },
      {
        id: 'day3-submission-prep',
        time: '16:30',
        title: 'Final Submission Preparation',
        type: 'Submission',
        description:
          'Wrap up project deliverables, push code to GitHub repositories, and submit final entries.',
        speaker: 'Organizers & Mentors',
        location: 'Submission Hub',
        duration: '60 min',
        points: [
          'Repository verification and licensing',
          'Slide deck and demo video uploads',
          'Official submission deadline confirmation',
        ],
      },
    ],
  },
  {
    id: 'day-4',
    dayNumber: 'Day 4',
    label: 'DAY 4 · WORKSHOP & WEBINAR',
    date: 'September 10, 2026',
    title: 'Build. Showcase. Celebrate.',
    description:
      'Hands-on workshops, webinars, expert demonstrations, team project presentations, community demos, and closing ceremony with winners announced.',
    link: '/day-4',
    sessions: [
      {
        id: 'day4-showcase',
        time: '09:30',
        title: 'Final Project Showcase',
        type: 'Showcase',
        description:
          'Teams present their final quantum projects, experiments, and prototypes to the judging panel.',
        speaker: 'Hackathon Finalists',
        location: 'Main Auditorium',
        duration: '75 min',
        points: [
          'Team live presentations and demos',
          'Judge Q&A and technical evaluation',
          'Community live voting and audience reaction',
        ],
      },
      {
        id: 'day4-workshop',
        time: '11:00',
        title: 'Quantum Workshop',
        type: 'Workshop',
        description:
          'Specialized masterclass on quantum machine learning and advanced quantum algorithms.',
        speaker: 'Guest Quantum Specialist',
        location: 'Workshop Hall A',
        duration: '60 min',
        points: [
          'Variational Quantum Eigensolver (VQE) overview',
          'Quantum neural networks and kernels',
          'Next steps in quantum research and industry careers',
        ],
      },
      {
        id: 'day4-webinar',
        time: '12:15',
        title: 'Expert Webinar',
        type: 'Webinar',
        description:
          'Interactive global webinar featuring IBM Quantum researchers on the future of quantum utility.',
        speaker: 'IBM Quantum Scientist',
        location: 'Live Stream & Auditorium',
        duration: '60 min',
        points: [
          'Frontiers of 100+ qubit utility era',
          'Real-world industrial quantum applications',
          'Global Qiskit community opportunities',
        ],
      },
      {
        id: 'day4-demo-sessions',
        time: '14:00',
        title: 'Team Demo Sessions',
        type: 'Demo',
        description:
          'Open-floor exhibition where participants interact with all submitted builds, tools, and demos.',
        speaker: 'All Participating Teams',
        location: 'Innovation Expo Floor',
        duration: '60 min',
        points: [
          'Interactive hands-on demo booths',
          'Open networking with peers and visitors',
          'Sharing code, learnings, and collaboration plans',
        ],
      },
      {
        id: 'day4-awards',
        time: '15:15',
        title: 'Awards & Recognition',
        type: 'Awards',
        description:
          'Celebrate standout projects, creative solutions, teamwork, and announce hackathon winners.',
        speaker: 'Judging Panel & Organizers',
        location: 'Main Auditorium',
        duration: '45 min',
        points: [
          'Category prize announcements and trophy presentations',
          'Recognition of outstanding mentors and student organizers',
          'Certificate eligibility and distribution guide',
        ],
      },
      {
        id: 'day4-closing',
        time: '16:15',
        title: 'Closing Session',
        type: 'Ceremony',
        description:
          'Wrap up the festival, celebrate the journey, take group photos, and connect for future events.',
        speaker: 'Organizing Committee',
        location: 'Main Auditorium',
        duration: '45 min',
        points: [
          'Event highlights and memorable moments recap',
          'Community photo session and final remarks',
          'Next steps in the regional quantum network',
        ],
      },
    ],
  },
]
