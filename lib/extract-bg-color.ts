

// Extract background color from custom template page node : match keywords: background-color, background
const extractBgColor = (html: string): string => {
    const DEFAULT_BG = "#ffffff";

    const bgColorMatch = html.match(/background-color:\s*([^;}"'\s][^;}"']*)/);
    if (bgColorMatch) return bgColorMatch[1].trim();

    const bgMatch = html.match(/(?<![a-z-])background:\s*([^;}"']+)/);
    if (!bgMatch) return DEFAULT_BG; // ← changed

    const colorToken = bgMatch[1]
        .split(/\s+/)
        .find(token =>
            /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+)/.test(token)
        );

    return colorToken?.replace(/[;}"']/g, "").trim() ?? DEFAULT_BG; // ← changed
};

export default extractBgColor;