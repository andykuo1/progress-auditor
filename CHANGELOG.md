# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2019-09-16
### Added
- Now has a safety net to log all data when it crashes
- New testing environment
- New config maker when there isn't one
- New review maker that can be customized for every review
- New UI system
- New interactive review build system
- New base scheme that handles generic reviews
- Allow empty reviews (for type 'empty')

### Changed
- A decent refactor of handlers and loaders
- Vacations now live in reviews for convenience
- Vacation padding is now applied at the top level config

### Removed
- All resolvers are now reviews without builders
- Scheme handler, use Review Registry instead (they are still called schemes though)

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

[Unreleased]: https://github.com/andykuo1/progress-auditor/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.2.0
[0.1.0]: https://github.com/andykuo1/progress-auditor/releases/tag/v0.1.0