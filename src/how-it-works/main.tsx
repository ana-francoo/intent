import { createRoot } from 'react-dom/client'
import App from '@/components/intent-onboarding-component/src/App.tsx'
import '@/components/intent-onboarding-component/src/index.css'

createRoot(document.getElementById("root")!).render(<App />);





// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import Index from '@/components/intent-onboarding-component/src/pages/Index'
// import '@/components/intent-onboarding-component/src/styles.css'
// import './how-it-works.css'

// // Mock handlers for standalone page
// const handleOnboardingComplete = () => {
//   console.log('Onboarding completed!');
//   // You can add logic here to handle completion, like redirecting or closing the tab
// };

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <div>
//       <Index />
//     </div>
//   </StrictMode>,
// ) 