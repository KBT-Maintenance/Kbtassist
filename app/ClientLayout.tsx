// This file was previously provided and assumed correct.
// It should have a default export if it's used as a component.
// If it's not a route segment, it doesn't strictly need a default export,
// but if it was causing an error, it implies it was being treated as one.
// Assuming it's a wrapper component, it should be fine without default export
// unless it's directly imported as a page.
// For safety, if it was causing an error, ensure it's used correctly or has a default export.
// Given its name, it's likely a wrapper, not a page.
// No changes needed here unless it was explicitly causing the error.
// For the purpose of fixing "Component cannot be found" on pages, this file is not the direct cause.
// Leaving as is, as it's not a page.tsx, layout.tsx, or loading.tsx.
