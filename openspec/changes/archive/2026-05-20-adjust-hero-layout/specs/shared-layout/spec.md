## MODIFIED Requirements

### Requirement: SiteHeader navigation text SHALL be at minimum 14px

All text inside `<SiteHeader>` SHALL have a font-size of at least 14px, including the nav links, the `◇` date label, and the TagChip pills (`EN`, theme toggle).

Previous value: `text-[10px]` on nav links, date label, and TagChip.

#### Scenario: Nav links are 14px

- **WHEN** the header is rendered
- **THEN** each nav `<a>` element has computed `font-size` of `14px`

#### Scenario: Date label is 14px

- **WHEN** the header is rendered
- **THEN** the `grayson / 2026` span has computed `font-size` of `14px`

### Requirement: SiteFooter text SHALL be at minimum 14px

`<SiteFooter>` text SHALL render at `14px`.

Previous value: `text-[10px]`.

#### Scenario: Footer text is 14px

- **WHEN** the footer is rendered
- **THEN** all three footer `<span>` elements have computed `font-size` of `14px`

### Requirement: TagChip text SHALL be at minimum 14px

`<TagChip>` SHALL render its slotted text at `14px`.

Previous value: `text-[10px]`.

#### Scenario: Default TagChip is 14px

- **WHEN** a TagChip is rendered without extra classes
- **THEN** the element's computed `font-size` is `14px`
