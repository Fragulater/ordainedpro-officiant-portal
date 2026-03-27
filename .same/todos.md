# Ordained Pro Officiant Portal - Todos

## Completed
- [x] Fixed client-side exceptions and login issues
- [x] Implemented session persistence with custom storage adapter
- [x] Moved Officiant Dashboard button and show officiant name in header
- [x] Implemented logout with instant redirect
- [x] Ensured all profile and upload data saved server-side in Supabase
- [x] Fixed upload errors related to Supabase Storage and RLS policies
- [x] Fixed CORS issues for avatar images in iframe environment
- [x] Created safe SQL schema for marketplace integration
- [x] Swapped header avatar to use officiant profile photo
- [x] Removed same-runtime and react-grab dependencies (Same IDE-specific)
- [x] Removed jsxImportSource from tsconfig.json
- [x] Removed same-runtime script from layout.tsx
- [x] Moved tailwindcss, postcss to dependencies
- [x] Added autoprefixer to dependencies and postcss.config.mjs
- [x] Removed conflicting package-lock.json
- [x] Updated netlify.toml build command
- [x] Build verified successfully locally
- [x] Optimized questionnaire - removed redundant questions already collected in Quick Setup
  - Removed from Wedding Details: bride/groom names, date, time, venue, guest count
  - Removed from Quick Setup dropdowns: ceremony style, ceremony length, unity ceremony, vows, reading style
  - Kept: love story, personal details, follow-up questions only
  - Added AUTO_POPULATED_FIELDS constant for reference
  - Reduced from 40+ to ~20 focused personalization questions

## Completed (Deployment)
- [x] Deploy to Netlify - Successfully deployed manually

## Completed (Recent)
- [x] Implemented Refine Script feature
  - Button lights up with animation after script is generated
  - Asks additional questions: add unity ceremonies, religious sections, cultural traditions
  - Allows removing/shortening sections and adjusting tone
  - Regenerates script with requested refinements
  - Added REFINEMENT_QUESTIONS array with 7 customization options
- [x] Added chatbot acknowledgment when user selects suggestions
  - Updated handleRefineResponse to acknowledge refinement question selections
  - Updated handleQuickResponse to acknowledge guided question selections
  - Updated handleQuestionnaireAnswer to acknowledge questionnaire responses
  - Chatbot now confirms what the user selected will be implemented
- [x] Added chatbot acknowledgment for free-form text input
  - Script generation requests get "Got it! I'm generating your ceremony script now..."
  - Modification requests get "I understand! Let me work on that change for you..."
  - Guided question answers get "Thanks for sharing! I'll use that in your ceremony script."
- [x] Removed flashing animation from "Refine Script" button
  - Removed animate-pulse, ring, and ping animations from the button
- [x] Implemented progressive button unlock flow
  - Generate Initial Script: grayed out until ceremony style & length selected in Quick Setup
  - Refine Script: grayed out until script generated AND 5 questions answered
  - Generate Final Script: grayed out until Refine Script process is completed
  - Added question count tracker and progress indicator
  - Added step-by-step helper text to guide users through the process

## Pending
- [ ] Deploy marketplace project
- [ ] Update portal environment variable with live marketplace URL
- [ ] Test real-time sync of scripts between portal and marketplace
- [ ] Test marketplace browsing and vendor dashboard access

## Notes
- Build succeeds locally with `bun run build`
- All Same IDE-specific dependencies removed
- Questionnaire now focused on personalization (reduced from 40+ to ~25 questions)
- Basic info auto-populated from Quick Setup cards
