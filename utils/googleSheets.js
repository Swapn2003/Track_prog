const { google } = require('googleapis');

class GoogleSheetsService {
    constructor(credentials) {
        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        });
        this.sheetsApi = google.sheets({ version: 'v4', auth: this.auth });
        this.driveApi = google.drive({ version: 'v3', auth: this.auth });
        this.spreadsheetIds = new Map(); // Store spreadsheet IDs by folder ID
        this.sheetIds = new Map(); // Store sheet IDs by folder ID
    }

    async initializeSpreadsheet(folderId) {
        try {
            // Check if we already have a spreadsheet ID for this folder
            let spreadsheetId = this.spreadsheetIds.get(folderId);
            console.log('Current spreadsheet ID for folder', folderId, ':', spreadsheetId);

            if (!spreadsheetId) {
                console.log('Creating new spreadsheet...');
                // Create a new spreadsheet
                const spreadsheet = await this.sheetsApi.spreadsheets.create({
                    requestBody: {
                        properties: {
                            title: 'DSA Progress Tracker'
                        },
                        sheets: [
                            {
                                properties: {
                                    title: 'Entries',
                                    gridProperties: {
                                        frozenRowCount: 1
                                    }
                                }
                            }
                        ]
                    }
                });

                spreadsheetId = spreadsheet.data.spreadsheetId;
                // Store the sheet ID
                this.sheetIds.set(folderId, spreadsheet.data.sheets[0].properties.sheetId);
                console.log('New spreadsheet created with ID:', spreadsheetId);
                console.log('Sheet ID:', this.sheetIds.get(folderId));

                // Move the spreadsheet to the user's folder
                try {
                    console.log('Moving spreadsheet to user folder...');
                    await this.driveApi.files.update({
                        fileId: spreadsheetId,
                        addParents: folderId,
                        fields: 'id, parents'
                    });
                    console.log('Spreadsheet moved successfully');
                } catch (moveError) {
                    console.error('Error moving spreadsheet:', moveError);
                }

                try {
                    console.log('Adding headers to spreadsheet...');
                    // Add headers
                    await this.sheetsApi.spreadsheets.values.update({
                        spreadsheetId,
                        range: 'Entries!A1:H1',
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [[
                                'Topic',
                                'Description',
                                'Problem Link',
                                'Approach',
                                'Code',
                                'Time Complexity',
                                'Space Complexity',
                                'Created At'
                            ]]
                        }
                    });
                    console.log('Headers added successfully');
                } catch (headerError) {
                    console.error('Error adding headers:', headerError);
                    throw headerError;
                }

                try {
                    console.log('Formatting spreadsheet...');
                    // Format headers
                    await this.sheetsApi.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [
                                {
                                    repeatCell: {
                                        range: {
                                            sheetId: this.sheetIds.get(folderId),
                                            startRowIndex: 0,
                                            endRowIndex: 1
                                        },
                                        cell: {
                                            userEnteredFormat: {
                                                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                                                textFormat: {
                                                    bold: true,
                                                    foregroundColor: { red: 1, green: 1, blue: 1 }
                                                }
                                            }
                                        },
                                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                                    }
                                }
                            ]
                        }
                    });
                    console.log('Formatting completed successfully');
                } catch (formatError) {
                    console.error('Error formatting spreadsheet:', formatError);
                }

                // Store the spreadsheet ID for this folder
                this.spreadsheetIds.set(folderId, spreadsheetId);
                console.log('Spreadsheet ID saved for folder:', folderId);
            } else {
                // Get the sheet ID for an existing spreadsheet
                const spreadsheet = await this.sheetsApi.spreadsheets.get({
                    spreadsheetId
                });
                this.sheetIds.set(folderId, spreadsheet.data.sheets[0].properties.sheetId);
                console.log('Retrieved existing sheet ID:', this.sheetIds.get(folderId));
            }

            return spreadsheetId;
        } catch (error) {
            console.error('Error in initializeSpreadsheet:', error);
            throw error;
        }
    }

    async addEntry(entry, folderId) {
        try {
            console.log('Starting to add entry...');
            const spreadsheetId = await this.initializeSpreadsheet(folderId);
            console.log('Using spreadsheet ID:', spreadsheetId);
            
            // Get the last row number
            console.log('Getting last row number...');
            const response = await this.sheetsApi.spreadsheets.values.get({
                spreadsheetId,
                range: 'Entries!A:A'
            });
            const nextRow = response.data.values ? response.data.values.length + 1 : 2;
            console.log('Next row number:', nextRow);

            // Prepare entry data
            const entryData = [
                entry.topic || '',
                entry.description || '',
                entry.problemLink || '',
                entry.approach || '',
                entry.code || '',
                entry.timeComplexity || '',
                entry.spaceComplexity || '',
                new Date().toISOString()
            ];

            console.log('Adding entry to sheet...');
            // Add the new entry
            await this.sheetsApi.spreadsheets.values.update({
                spreadsheetId,
                range: `Entries!A${nextRow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [entryData]
                }
            });
            console.log('Entry added successfully');

            try {
                console.log('Auto-resizing columns...');
                // Auto-resize columns
                await this.sheetsApi.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                autoResizeDimensions: {
                                    dimensions: {
                                        sheetId: this.sheetIds.get(folderId),
                                        dimension: 'COLUMNS',
                                        startIndex: 0,
                                        endIndex: 8
                                    }
                                }
                            }
                        ]
                    }
                });
                console.log('Columns auto-resized successfully');
            } catch (resizeError) {
                console.error('Error auto-resizing columns:', resizeError);
                // Don't throw error for resize failure
            }

            return nextRow;
        } catch (error) {
            console.error('Error in addEntry:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw error;
        }
    }

    async deleteEntry(rowIndex, folderId) {
        try {
            console.log('Starting to delete entry from row:', rowIndex);
            const spreadsheetId = await this.initializeSpreadsheet(folderId);
            
            await this.sheetsApi.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: this.sheetIds.get(folderId),
                                    dimension: 'ROWS',
                                    startIndex: rowIndex - 1,
                                    endIndex: rowIndex
                                }
                            }
                        }
                    ]
                }
            });
            console.log('Entry deleted successfully');

            return true;
        } catch (error) {
            console.error('Error in deleteEntry:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw error;
        }
    }

    async updateEntry(entry, folderId) {
        try {
            console.log('Starting to update entry...');
            const spreadsheetId = await this.initializeSpreadsheet(folderId);
            
            // Update the entry at the specified row
            const entryData = [
                entry.topic || '',
                entry.description || '',
                entry.problemLink || '',
                entry.approach || '',
                entry.code || '',
                entry.timeComplexity || '',
                entry.spaceComplexity || '',
                new Date().toISOString()
            ];

            await this.sheetsApi.spreadsheets.values.update({
                spreadsheetId,
                range: `Entries!A${entry.sheetRowIndex}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [entryData]
                }
            });

            return true;
        } catch (error) {
            console.error('Error in updateEntry:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            throw error;
        }
    }
}

module.exports = GoogleSheetsService; 