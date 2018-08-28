# Requirements

## Technical
* [Node.js](https://nodejs.org/en/) v8.9.0
* [Drush](https://www.drush.org/) installed globally
* [cv](https://github.com/civicrm/cv) installed globally

## Site config file
BackstopJS takes the screenshots from your local CiviHR, and to do so it needs to know some data about your local site, which is contained in a file called *site-config.json*.

If you don't have the file yet, then simply running the `:reference` (or `:test`) command will automatically create one for you, which you can then fill in with the correct data.

## Required Data
In order for the whole test suite to be run successfully, you need to have a minimum amount of data in your local site:

### Users
The following users needs to be present:
* *admin*
* *civihr_admin*
* *civihr_manager*
* *civihr_staff*

### Job Contract & Job Roles
* At least one contract for *civihr_staff*
* At least one job role for *civihr_staff*

### Tasks & Documents
* At least one task with *civihr_staff* as target
* At least one document with *civihr_staff* as target
* For both *civihr_admin* and *admin*: at least two tasks assigned to them, one of which is completed. (Make sure in SSP Tasks page, the tasks block shows one record, and the "Show Completed Tasks modal" shows at least one record)

### Leave & Absences
* *civihr_staff* needs to have a "has leave approved by" relationship with *civihr_admin*
* Leave and Absence sample data is present (see [here](https://compucorp.atlassian.net/wiki/spaces/PCHR/pages/107610281))
* An Absence Period for the current year
* Absence Type of leave type with calculation unit as hours with the exact label of "Holiday in Hours" (make sure to update *civihr_staff*'s contract after the absence type creation to ensure there are entitlements for this absence type for the current absence period)
* One Leave request for *civihr_staff* in "More Information Required" status
* One TOIL request for *civihr_staff* in "More Information Required" status
* One Sick request for *civihr_staff* in "More Information Required" status
* For *civihr_staff* → My Leave → Report → Open Requests section → first leave request should have comments from both *civihr_staff* and *civihr_manager*

### SSP
* All the steps from [Setup SSP data on local](https://compucorp.atlassian.net/wiki/spaces/PCHR/pages/121302426/Setup+SSP+data+on+local) have been followed
* The onboarding wizard has been completed for *civihr_admin*
