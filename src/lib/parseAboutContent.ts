import xss from "xss";

interface EditorJsBlock {
	type: string;
	data: { text?: string; level?: number };
}

interface EditorJsDocument {
	blocks?: EditorJsBlock[];
}

export interface AboutItem {
	title: string;
	description: string;
}

export interface AboutProseSection {
	title: string;
	paragraphs: string[];
}

export interface AboutObjectivesSection {
	title: string;
	intro?: string;
	items: AboutItem[];
}

export interface AboutValuesSection {
	title: string;
	items: AboutItem[];
}

export interface ParsedAboutContent {
	about: AboutProseSection;
	mission: AboutProseSection;
	objectives: AboutObjectivesSection;
	values: AboutValuesSection;
}

const BULLET_PREFIX = "· ";

function stripToPlainText(html: string): string {
	return xss(html, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script", "style"] }).trim();
}

function splitBulletItem(text: string): AboutItem | null {
	const withoutBullet = text.slice(BULLET_PREFIX.length);
	const colonIndex = withoutBullet.indexOf(":");
	if (colonIndex === -1) return null;
	const title = withoutBullet.slice(0, colonIndex).trim();
	const description = withoutBullet.slice(colonIndex + 1).trim();
	if (!title || !description) return null;
	return { title, description };
}

function splitIntroAndItems(paragraphs: string[]): { intro: string[]; items: AboutItem[] } {
	const intro: string[] = [];
	const items: AboutItem[] = [];
	for (const paragraph of paragraphs) {
		if (paragraph.startsWith(BULLET_PREFIX)) {
			const item = splitBulletItem(paragraph);
			if (item) items.push(item);
		} else {
			intro.push(paragraph);
		}
	}
	return { intro, items };
}

/**
 * Parses the About CMS page's Editor.js content into the 4 fixed sections
 * (About/Mission/Objectives/Values), grouped by POSITION of level-1 header
 * blocks — not by matching header text, since EN/AR headers differ.
 *
 * Returns null (rather than throwing) on any unexpected structure, so
 * callers can fall back to the generic prose renderer instead of crashing.
 */
export function parseAboutContent(rawContent: string | null | undefined): ParsedAboutContent | null {
	if (!rawContent) return null;

	let doc: EditorJsDocument;
	try {
		doc = JSON.parse(rawContent) as EditorJsDocument;
	} catch {
		return null;
	}

	const blocks = doc.blocks;
	if (!Array.isArray(blocks) || blocks.length === 0) return null;

	const sections: AboutProseSection[] = [];
	for (const block of blocks) {
		if (block.type === "header" && block.data.level === 1) {
			sections.push({ title: stripToPlainText(block.data.text ?? ""), paragraphs: [] });
			continue;
		}
		if (block.type === "paragraph") {
			const text = stripToPlainText(block.data.text ?? "");
			if (!text || sections.length === 0) continue;
			sections[sections.length - 1].paragraphs.push(text);
		}
	}

	if (sections.length < 4) return null;

	const [aboutSection, missionSection, objectivesSection, valuesSection] = sections;

	const objectivesParsed = splitIntroAndItems(objectivesSection.paragraphs);
	const valuesParsed = splitIntroAndItems(valuesSection.paragraphs);

	if (objectivesParsed.items.length === 0 || valuesParsed.items.length === 0) {
		return null;
	}

	return {
		about: aboutSection,
		mission: missionSection,
		objectives: {
			title: objectivesSection.title,
			intro: objectivesParsed.intro[0],
			items: objectivesParsed.items,
		},
		values: {
			title: valuesSection.title,
			items: valuesParsed.items,
		},
	};
}
