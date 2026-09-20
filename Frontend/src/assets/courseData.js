const baseCourses = [
  {
    id: 1,
    title: "DevOps A to Z Mastery",
    topic: "Cloud & DevOps",
    durationLabel: "18 hours",
    level: "Intermediate",
    instructor: "Aarav Mehta",
    wikimediaTitle: "DevOps",
    description: "Build reliable delivery pipelines with AWS, Docker, Kubernetes, and CI/CD.",
    overview: "Move from local development to confident production releases by learning how modern DevOps teams plan, automate, deploy, and monitor software.",
    outcomes: ["Create automated CI/CD pipelines", "Containerize applications with Docker", "Deploy and scale services with Kubernetes", "Monitor releases and troubleshoot failures"],
    modules: ["DevOps foundations and Git workflows", "Linux, networking, and scripting essentials", "Docker images and container orchestration", "AWS deployment fundamentals", "Kubernetes, CI/CD, and observability"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFlJeP0kRB8US7NhL2F6YBAlhJMjzPIdLNqWt-F5NOaQ&s=10",
    alt: "DevOps tools and workflow",
  },
  {
    id: 2,
    title: "Java Full-Stack",
    topic: "Development",
    durationLabel: "24 hours",
    level: "Intermediate",
    instructor: "Priya Sharma",
    wikimediaTitle: "Java (programming language)",
    description: "Create production-ready applications with Java, Spring Boot, Hibernate, and Maven.",
    overview: "Build a complete web application from a clean Java backend to a responsive frontend, with persistence, authentication, testing, and deployment included.",
    outcomes: ["Build REST APIs with Spring Boot", "Persist data with Hibernate and SQL", "Connect frontend and backend applications", "Test and package production services"],
    modules: ["Java and object-oriented programming", "Spring Boot and REST API design", "Databases, JPA, and Hibernate", "Frontend integration and authentication", "Testing, Maven, and deployment"],
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCO3jvxn3ABmRI8o9QvKKjf0rpNL0ejFjOH_APyxCWbQ&s=10",
    alt: "Java programming code",
  },
  {
    id: 3,
    title: "DSA Complete",
    topic: "Computer Science",
    durationLabel: "14 hours",
    level: "Beginner to intermediate",
    instructor: "Rohan Kapoor",
    wikimediaTitle: "Data structure",
    description: "Strengthen problem-solving skills through graphs, heaps, stacks, and dynamic programming.",
    overview: "Develop the structured thinking needed for technical interviews and real software by mastering core data structures and algorithmic patterns.",
    outcomes: ["Choose the right data structure for a problem", "Analyze time and space complexity", "Solve graph and tree problems", "Apply dynamic programming patterns"],
    modules: ["Complexity analysis and arrays", "Linked lists, stacks, and queues", "Trees, heaps, and hash tables", "Graphs and traversal algorithms", "Sorting, searching, and dynamic programming"],
    image: "https://miro.medium.com/0*TazBnJw1_YH1ibTx",
    alt: "Data structures and algorithms",
  },

  {
    id: 4,
    title: "Practical Data Analytics",
    topic: "Data Analytics",
    durationLabel: "16 hours",
    level: "Beginner to intermediate",
    instructor: "Neha Verma",
    wikimediaTitle: "Data analysis",
    description: "Turn raw information into useful decisions with SQL, spreadsheets, Python, and dashboards.",
    overview: "Learn a practical analysis workflow that takes you from messy data to clear insights, compelling visualizations, and confident business recommendations.",
    outcomes: ["Clean and prepare datasets for analysis", "Write SQL queries for useful insights", "Build clear charts and dashboards", "Explain findings with data-driven stories"],
    modules: ["Data analysis workflow and spreadsheets", "SQL queries and relational data", "Python with pandas for analysis", "Charts, dashboards, and reporting", "Projects and communicating insights"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    alt: "Data analytics dashboard on a screen",
  },
  {
    id: 5,
    title: "Cybersecurity Fundamentals",
    topic: "Cybersecurity",
    durationLabel: "20 hours",
    level: "Beginner",
    instructor: "Kabir Singh",
    wikimediaTitle: "Computer security",
    description: "Learn the essential practices used to protect accounts, networks, applications, and data.",
    overview: "Build a strong security mindset through hands-on foundations in threats, identity, encryption, network defense, and incident response.",
    outcomes: ["Recognize common security threats and attacks", "Apply secure identity and access practices", "Understand encryption and network defense", "Create a practical incident response plan"],
    modules: ["Security principles and threat awareness", "Identity, authentication, and access control", "Networks, firewalls, and secure protocols", "Encryption, privacy, and secure applications", "Monitoring and incident response"],
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
    alt: "Cybersecurity lock symbol on a laptop",
  },
  {
    id: 6,
    title: "AI & Machine Learning Essentials",
    topic: "AI & Machine Learning",
    durationLabel: "22 hours",
    level: "Beginner to intermediate",
    instructor: "Ishita Rao",
    wikimediaTitle: "Machine learning",
    description: "Understand how machine learning models learn from data and solve real-world problems.",
    overview: "Explore the complete machine learning lifecycle, from preparing data and choosing a model to evaluating results and explaining predictions.",
    outcomes: ["Prepare data for machine learning models", "Choose classification and regression approaches", "Evaluate model performance responsibly", "Build a small end-to-end ML project"],
    modules: ["AI concepts and Python foundations", "Data preparation and feature engineering", "Regression and classification", "Model evaluation and improvement", "Responsible AI and final project"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
    alt: "Abstract artificial intelligence illustration",
  },
  {
    id: 7,
    title: "Internet of Things Foundations",
    topic: "IoT",
    durationLabel: "15 hours",
    level: "Beginner",
    instructor: "Maya Nair",
    wikimediaTitle: "Internet of things",
    description: "Learn how connected devices collect, share, and act on data in real-world systems.",
    overview: "Understand the building blocks of IoT, from sensors and connectivity to edge processing, cloud platforms, and secure device management.",
    outcomes: ["Explain the parts of an IoT system", "Connect sensors to collect useful data", "Compare edge and cloud processing", "Apply basic IoT security practices"],
    modules: ["IoT concepts and connected devices", "Sensors, gateways, and communication", "Edge computing and cloud platforms", "Data pipelines and device management", "Security and a smart home project"],
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    alt: "Electronic circuit board representing connected devices",
  },
];

const learningContent = {
  1: {
    lessons: [
      "Map the DevOps lifecycle from planning and source control through release, feedback, and continuous improvement.",
      "Use Linux commands, networking concepts, and small scripts to inspect services and automate repeatable work.",
      "Package an application into a reproducible Docker image and understand how containers are scheduled and scaled.",
      "Compare core AWS deployment building blocks and choose an infrastructure shape that fits the service you are shipping.",
      "Connect CI/CD, Kubernetes, and observability so releases are repeatable, measurable, and easier to recover.",
    ],
    quiz: [
      ["What is the main goal of CI/CD?", ["Automate reliable build, test, and delivery steps", "Replace source control", "Remove monitoring", "Store passwords"], 0],
      ["What does a container package?", ["An application and its dependencies", "Only a domain name", "A physical server", "A user profile"], 0],
      ["Which tool orchestrates containers?", ["Kubernetes", "Photoshop", "Excel", "SMTP"], 0],
      ["What does monitoring help a team do?", ["Detect system behavior and failures", "Hide deployments", "Delete logs", "Avoid testing"], 0],
      ["What is infrastructure as code?", ["Defining infrastructure in versioned files", "Drawing a network diagram only", "Buying hardware manually", "Writing UI styles"], 0],
    ],
  },
  2: {
    lessons: [
      "Practice Java classes, interfaces, composition, and encapsulation to model behavior without tightly coupling components.",
      "Design Spring Boot REST endpoints with clear resources, validation, status codes, and error responses.",
      "Persist domain objects with SQL, JPA, and Hibernate while understanding transactions and relationship boundaries.",
      "Connect a browser client to an authenticated backend and keep user input, sessions, and permissions under control.",
      "Use Maven, automated tests, and deployment configuration to package a service that can be maintained in production.",
    ],
    quiz: [
      ["What does encapsulation protect?", ["An object's internal state and rules", "A server rack", "A CSS stylesheet", "A database connection only"], 0],
      ["What does a REST endpoint expose?", ["A resource operation over HTTP", "A Java compiler", "A screen resolution", "A password vault"], 0],
      ["What is JPA used for?", ["Mapping Java objects to relational data", "Styling HTML", "Routing network cables", "Compressing images"], 0],
      ["Why validate API input?", ["To reject invalid or unsafe data early", "To make requests slower", "To remove authentication", "To hide errors"], 0],
      ["What does Maven manage?", ["Builds and project dependencies", "Browser cookies", "Cloud electricity", "Design mockups"], 0],
    ],
  },
  3: {
    lessons: [
      "Estimate time and space complexity, then use arrays and searching patterns to make a solution efficient and explainable.",
      "Choose linked lists, stacks, or queues based on access patterns, mutation needs, and the order in which work should be processed.",
      "Use trees, heaps, and hash tables to organize data for fast lookup, priority selection, and hierarchical relationships.",
      "Traverse graphs with BFS and DFS, tracking visited nodes and selecting the right representation for the problem.",
      "Compare sorting and dynamic programming strategies by breaking a problem into reusable subproblems and measurable tradeoffs.",
    ],
    quiz: [
      ["What does Big O describe?", ["How resource use grows with input size", "A programming language", "A database row", "A UI color"], 0],
      ["Which structure follows last-in, first-out order?", ["Stack", "Queue", "Graph", "Hash table"], 0],
      ["What is a heap useful for?", ["Efficient priority access", "Storing paragraphs", "Rendering a webpage", "Encrypting a password"], 0],
      ["What does BFS use to explore layers?", ["A queue", "A stack only", "A compiler", "A spreadsheet"], 0],
      ["What is dynamic programming based on?", ["Overlapping subproblems and stored results", "Random guesses", "Deleting input", "Only nested loops"], 0],
    ],
  },
  4: {
    lessons: [
      "Frame an analysis question, inspect a dataset, and document assumptions before changing or calculating anything.",
      "Write SQL with filters, joins, grouping, and aggregates to turn relational tables into useful business questions.",
      "Use pandas to inspect, clean, reshape, and summarize data while keeping transformations reproducible.",
      "Select charts that match the question, then build a dashboard that makes the important comparison easy to see.",
      "Turn evidence into a recommendation by explaining uncertainty, audience impact, and the next action clearly.",
    ],
    quiz: [
      ["Why define an analysis question first?", ["It keeps the work focused on a decision", "It removes the need for data", "It guarantees a result", "It replaces validation"], 0],
      ["Which SQL clause groups rows for aggregation?", ["GROUP BY", "STYLE BY", "ORDER HTML", "JOIN CSS"], 0],
      ["What does pandas help with?", ["Tabular data preparation and analysis", "Network security", "Container orchestration", "Video editing"], 0],
      ["What makes a chart effective?", ["It makes the relevant comparison clear", "It uses the most colors possible", "It hides labels", "It always uses 3D"], 0],
      ["What should a recommendation include?", ["Evidence, context, and a clear next action", "Only raw rows", "A password", "Unverified guesses"], 0],
    ],
  },
  5: {
    lessons: [
      "Recognize threats, vulnerabilities, and attack surfaces, then apply a practical risk mindset to everyday decisions.",
      "Strengthen identity with unique credentials, multi-factor authentication, least privilege, and careful access reviews.",
      "Understand network boundaries, firewalls, secure protocols, and the signals that indicate suspicious traffic.",
      "Use encryption and secure development habits to protect data in transit, at rest, and inside applications.",
      "Build an incident response loop that detects, contains, recovers from, and learns from security events.",
    ],
    quiz: [
      ["What is least privilege?", ["Granting only the access needed for a task", "Giving everyone admin rights", "Sharing one password", "Removing all accounts"], 0],
      ["What does phishing commonly target?", ["Credentials and sensitive information", "Screen brightness", "CPU fans", "File colors"], 0],
      ["What does encryption provide?", ["Confidentiality by transforming readable data", "Unlimited storage", "Faster Wi-Fi", "Automatic backups"], 0],
      ["What does a firewall control?", ["Network traffic based on rules", "Keyboard layout", "User birthdays", "Image resolution"], 0],
      ["What is the first response priority during an incident?", ["Contain the impact while preserving evidence", "Delete every log", "Announce blame", "Disable all updates"], 0],
    ],
  },
  6: {
    lessons: [
      "Distinguish AI, machine learning, and deep learning while framing a useful prediction problem and its success measure.",
      "Prepare datasets by handling missing values, selecting features, and splitting examples so evaluation is trustworthy.",
      "Compare regression and classification models and connect each approach to the kind of output a problem requires.",
      "Evaluate predictions with appropriate metrics, diagnose overfitting, and improve a model without hiding poor results.",
      "Ship a small responsible ML project with explainable decisions, documented limits, and attention to fairness and privacy.",
    ],
    quiz: [
      ["What does a training dataset provide?", ["Examples from which a model learns patterns", "Final user passwords", "A replacement for evaluation", "Only images"], 0],
      ["What is a feature?", ["An input signal used by a model", "A deployment server", "A test account", "A chart title"], 0],
      ["What does classification predict?", ["A category or label", "A continuous amount only", "A network cable", "A file extension"], 0],
      ["What is overfitting?", ["Learning training examples too closely", "Training with no examples", "A faster algorithm", "A secure password"], 0],
      ["Why document model limitations?", ["To make decisions and risks understandable", "To avoid testing", "To guarantee fairness", "To remove data"], 0],
    ],
  },
  7: {
    lessons: [
      "Map an IoT system from sensors and actuators to gateways, networks, cloud services, and the decisions they enable.",
      "Choose sensors and communication protocols based on signal quality, power limits, distance, and the environment involved.",
      "Compare edge and cloud processing to decide where latency, cost, privacy, and reliability should be optimized.",
      "Design a data pipeline that registers devices, validates readings, and manages updates across a growing fleet.",
      "Secure connected products with strong device identity, encrypted communication, safe updates, and a clear recovery plan.",
    ],
    quiz: [
      ["What does an IoT sensor do?", ["Collects information from its environment", "Compiles a website", "Encrypts every backup", "Displays a spreadsheet"], 0],
      ["Why use a gateway?", ["To connect local devices to another network or service", "To replace every sensor", "To remove device identity", "To store paper records"], 0],
      ["When is edge processing useful?", ["When local, low-latency decisions matter", "Only when there is no sensor", "When data must never be read", "Only for printing"], 0],
      ["What does device management include?", ["Registration, health, configuration, and updates", "Only changing colors", "Deleting telemetry", "Removing authentication"], 0],
      ["Why secure IoT devices?", ["They can expose physical systems and sensitive data", "Security increases battery size", "It removes connectivity", "It prevents all updates"], 0],
    ],
  },
};

const courseVideoSources = {
  1: ["RGOj5yH7evk", "3c-iBn73dDE", "X48VuDVv0do", "ulprqHHWlng", "9pZ2xmsSDdo"],
  2: ["8cm1x4bC610", "eIrMbAQSU34", "vtPkZShrvXQ", "35EQXmHKZYs", "A74TOX803D0"],
  3: ["V6mKVRU1evU", "8hly31xKli0", "RBSGKlAvoiM", "pKO9UjSeLew", "fAAZixBzIAI"],
  4: ["U4c2pYt3RZ8", "qwAFL1597eM", "r-uOLxNrNk8", "yJw0x4m3K2Q", "9NUa2Tn7cXQ"],
  5: ["5Q1dfB0YJm4", "inWWhr5tnEA", "3Kq1MIfTWCE", "lPA0QwZ7pAA", "fNzpcB2uY6E"],
  6: ["Gv9_4yMHFAM", "aircAruvnKk", "GwIo3gDZCVQ", "tPYj3fFJGjk", "ukzFI9rgwfU"],
  7: ["LlhmzVL5bm8", "6mBO2vqLv38", "aK1L7n5pQ2M", "qj3w9kLm2P0", "IoT7mN2qX8A"],
};

const enrichedCourses = baseCourses.map((course) => {
  const content = learningContent[course.id];
  if (!content) return course;

  return {
    ...course,
    lessons: course.modules.map((module, index) => ({
      id: index + 1,
      title: module,
      description: content.lessons[index],
      videoTitle: `${module} video lesson`,
      videoUrl: `https://www.youtube.com/watch?v=${courseVideoSources[course.id][index]}`,
      duration: `${10 + index * 3} min`,
    })),
    finalQuiz: content.quiz.map(([question, options, answer]) => ({ question, options, answer })),
  };
});

export const defaultCourses = enrichedCourses;
export const Courses = enrichedCourses;
export default enrichedCourses;

