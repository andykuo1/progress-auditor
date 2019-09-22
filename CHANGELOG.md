# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2019-09-23
### Changed
- Released version 1.0.0

## [0.4.3] - 2019-09-22
### Changed
- Batch processing now applies to all selected automatically
- Updated index exports to use new utilities

### Fixed
- Removed false-negative error for add_owner_key.

## [0.4.2] - 2019-09-17
### Added
- `change_assignment` review now has history tracking

### Fixed
- Missing version number in the title
- Post number propagation now works correctly for all assignment types
- PDF exporting will now check for overwrite as well

## [0.4.1] - 2019-09-17
### Added
- Another save-review check if review session fails
- Added more auto-complete for other review types
- Stack traces for unexpected errors

### Changed
- User ID is now PID instead of e-mail

### Fixed
- Missing error count output for review session

## [0.4.0] - 2019-09-16
### Added
- Now has a safety net to log all data when it crashes
- New testing environment
- New config resolution technique when things are missing
- New review maker that can be customized for every review
- New UI system
- New interactive review build system
- New review form completion
- New base scheme that handles generic reviews
- Allow empty reviews (for type 'empty')
- Error skipping
- New review for ignoring other reviews (reflection-ish)
- The Progress Otter wants to say more things
- Escape at any time
- Autocomplete system for options
- Batch error processing by type
- Cache output on error
- Force check for overwriting files

### Changed
- A decent refactor of handlers and loaders
- Vacations now live in reviews for convenience
- Vacation padding is now applied at the top level config
- Move review saves to before error logs

### Removed
- All resolvers are now reviews without builders
- Scheme handler, use Review Registry instead (they are still called schemes though)

### Fixed
- Assignment changes for "last" now propagate correctly

## [0.3.2] - 2019-09-09
### Added
- Allow absolute paths for config paths
- maxEndDates option for cohort parsing

### Changed
- Auto date for output no longer uses time, only dates
- Review outputs now save the ENTIRE review database to file

### Fixed
- Weird month offset for assignments

## [0.3.1] - 2019-09-09
### Fixed
- Executable executes at (seemingly) random directory
- Executable crashes for exporting PDF

## [0.3.0] - 2019-09-08
### Added
- Output can now auto-append dates
- Inputs and outputs can have custom defined scripts
- Default implementations for assignment patterns
- Default implementations for input formats
- PDF exporting for student reports
- Added stack tracing for debug mode

### Changed
- Revamped API system (again with less clutter)
- Selection lists have END dividers
- Debug output now always confirms with user before saving
- Allow input file paths to not exist and be ignored instead
- Added ProgressOtter to the battlefront
- Moved more info to before the error review
- Added submission date change review type
- Disabled default config

### Fixed
- Duplicate reviews should not crash
- Flipped review signature documentation
- Reworded "Ill-formatted" to make more sense

### Removed
- Null review type from the review selection list

## [0.2.0] - 2019-08-25
### Added
- CLI Error handling
- CLI Review system
- Scheme system (with default Piazza scheme)
- Add Submission review type
- Change Assignment Status review type
- Output now shows name of user
- Output now shows how many assignments are due

### Changed
- Revamped API system (hopfully less complicated)
- Due date to count from UTC-12 to compensate for all time zones
- Reoreded output to most recent due -> first submission
- Made all databases to use owner keys when possible
- Average slip day calculations are now done as medians

### Fixed
- Fix output not creating parent directories as well

### Removed
- No longer support reviewer and resolver external scripts

## [0.1.0] - 2019-08-11
### Added
- Generate instructor report for users
- Evaluate vacations for users
- Generate schedules based on user information
- Generic review process system
- Process submissions for assignments

[Unreleased]: https://github.com/andykuo1/progress-auditor/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v1.0.0
[0.4.3]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.4.3
[0.4.2]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.4.2
[0.4.1]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.4.1
[0.4.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.4.0
[0.3.2]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.3.2
[0.3.1]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.3.1
[0.3.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.3.0
[0.2.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.2.0
[0.1.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.1.0