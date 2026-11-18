/* ==========================================================================
   DATA+ ACADEMY · people (shared by all events)
   A session lists its presenters by id in <n>/content/academy.js, e.g.
     presenters: [{ id: "christof-schwarz", role: "Moderator" }, "leon-schmidt"]
   role = what the person does in that session (optional), title = job title.
   Photos: square image in assets/people/<id>.jpg. Missing file → initials.
   ========================================================================== */
window.ACADEMY_PEOPLE = {
  photoBase: "../assets/people/",   // relative to an event page (<n>/index.html)
  people: {
    "christof-schwarz": { name: "Christof Schwarz", title: "", photo: "christof-schwarz.jpg" },
    "ahmad-abou-ezzah": { name: "Ahmad Abou Ezzah", title: "Data+ Specialist", photo: "ahmad-abou-ezzah.jpg" },
    "leon-schmidt":     { name: "Leon Schmidt", title: "Senior Consultant", photo: "leon-schmidt.jpg" }
  }
};
