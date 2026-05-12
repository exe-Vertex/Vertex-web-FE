# Website Structure

Updated: 2026-05-12T03:40:34.258Z

## Summary

- Entry point: Landing → Login → Workspaces
- Top-level sections: 6
- Total nodes: 36
- Total routes in App.tsx: 10

```text
Landing
├ Features
├ Pricing
├ Changelog
├ Resources
│ ├ Documentation
│ ├ Guides
│ ├ Blog
│ └ Community
├ Legal
│ ├ Terms
│ └ Privacy
└ Login
  └ Workspace
    ├ Student Workspace
    │ ├ Dashboard
    │ │ ├ Active Projects
    │ │ ├ Tasks Today
    │ │ └ Progress Overview
    │ ├ Projects
    │ │ ├ Timeline
    │ │ └ Calendar
    │ ├ Members
    │ └ Settings
    ├ Lecturer Workspace
    │ ├ Overview
    │ ├ Groups
    │ │ └ Group Detail
    │ ├ Deadlines
    │ └ Settings
    └ Admin Workspace
      ├ Users
      ├ AI
      ├ Analytics
      ├ Audit Log
      └ Config
```

Source: generated from UX-facing routes and workspace navigation in src/App.tsx and dashboard views.
