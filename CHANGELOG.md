# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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