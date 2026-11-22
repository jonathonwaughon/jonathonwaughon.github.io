/* =========================================================
   SITE NAVIGATION: the sidebar on every page is built from this.

   Top-level items are PAGES; their children are sections on that page.

   Links are written relative to the site root, so the same list
   works from any page:
     "#about"           a section on the homepage
     "resume/"          another page
     "resume/#skills"   a section on another page

   Any item can have `children`, nested as deep as you like.
   ========================================================= */
window.SITE_NAV = [
  {
    label: "Home", href: "#home",
    children: [
      {
        label: "About", href: "#about",
        children: [
          { label: "Background", href: "#background" },
          {
            label: "Skills", href: "#skills",
            children: [
              { label: "Languages", href: "#skills-languages" },
              { label: "Tools", href: "#skills-tools" },
            ],
          },
        ],
      },
      {
        label: "Projects", href: "#projects",
        children: [
          {
            label: "Web", href: "#projects-web",
            children: [
              { label: "This Portfolio", href: "#project-portfolio" },
              { label: "Project blahlglala", href: "#project-blah" },
            ],
          },
          {
            label: "Other", href: "#projects-other",
            children: [
              { label: "project whatever", href: "#project-whatever" },
              { label: "project 1 ig", href: "#project-1" },
            ],
          },
        ],
      },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    label: "Resume", href: "resume/",
    children: [
      { label: "Skills", href: "resume/#skills" },
      { label: "Experience", href: "resume/#experience" },
      { label: "Projects", href: "resume/#projects" },
    ],
  },
];
