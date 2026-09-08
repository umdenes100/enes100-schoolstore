// Fetches the current list of ENES100 section numbers from the umd.io course API.
// Docs: https://docs.umd.io/courses/

const UMD_API_BASE = "https://api.umd.io/v1";
const COURSE_ID = "ENES100";

// umd.io semester codes are YYYYMM where MM is 01 (spring) or 08 (fall).
// ENES100 is only offered fall/spring, so months Jan-Jul map to that year's
// spring term and Aug-Dec map to that year's fall term.
export function getCurrentSemester(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const term = month >= 8 ? "08" : "01";
    return `${year}${term}`;
}

export async function fetchCurrentEnes100Sections(semester = getCurrentSemester()) {
    const url = `${UMD_API_BASE}/courses/sections?course_id=${COURSE_ID}&semester=${semester}&per_page=100`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`umd.io request failed: ${response.status} ${response.statusText}`);
    }

    const sections = await response.json();
    return [...new Set(sections.map(section => section.number))];
}
