const { google } = require('googleapis');

class GoogleSheetsService {
    constructor(credentials) {
        console.log('Initializing Google Sheets service...');
        this.auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        });
        this.sheetsApi = google.sheets({ version: 'v4', auth: this.auth });
        this.driveApi = google.drive({ version: 'v3', auth: this.auth });
        this.spreadsheetIds = new Map(); // Store spreadsheet IDs by folder ID
        this.sheetIds = new Map(); // Store sheet IDs by folder ID
        console.log('Google Sheets service initialized');
    }

    async testConnection(folderId) {
        console.log('\n=== Testing Google Sheets connection ===');
        try {
            // Test Drive API
            console.log('Testing Drive API access...');
            const driveResponse = await this.driveApi.files.list({
                q: `'${folderId}' in parents`,
                pageSize: 1,
                fields: 'files(id, name)'
            });
            console.log('Drive API test successful');

            // Test Sheets API by trying to find or create spreadsheet
            console.log('Testing Sheets API access...');
            const spreadsheetId = await this.initializeSpreadsheet(folderId);
            console.log('Sheets API test successful');

            return {
                driveApiStatus: 'working',
                sheetsApiStatus: 'working',
                folderId,
                spreadsheetId,
                driveFiles: driveResponse.data.files
            };
        } catch (error) {
            console.error('Connection test failed:', error);
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    async findExistingSpreadsheet(folderId) {
        console.log('\n=== Finding existing spreadsheet ===');
        console.log('Folder ID:', folderId);
        try {
            const response = await this.driveApi.files.list({
                q: `name = 'DSA Progress Tracker' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet'`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            console.log('Search response:', response.data);

            if (response.data.files.length > 0) {
                const spreadsheetId = response.data.files[0].id;
                console.log('Found existing spreadsheet:', spreadsheetId);
                return spreadsheetId;
            }
            console.log('No existing spreadsheet found');
            return null;
        } catch (error) {
            console.error('Error searching for spreadsheet:', error);
            throw error;
        }
    }

    async createNewSpreadsheet(folderId) {
        try {
            console.log('Creating new spreadsheet...');
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

            const spreadsheetId = spreadsheet.data.spreadsheetId;
            this.sheetIds.set(folderId, spreadsheet.data.sheets[0].properties.sheetId);

            // Move to user's folder
            await this.driveApi.files.update({
                fileId: spreadsheetId,
                addParents: folderId,
                fields: 'id, parents'
            });

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

            console.log('New spreadsheet created:', spreadsheetId);
            return spreadsheetId;
        } catch (error) {
            console.error('Error creating new spreadsheet:', error);
            throw error;
        }
    }

    async initializeSpreadsheet(folderId) {
        try {
            // Check if we already have a cached spreadsheet ID
            let spreadsheetId = this.spreadsheetIds.get(folderId);
            
            
            // Look for existing spreadsheet in the folder
            spreadsheetId = await this.findExistingSpreadsheet(folderId);
            
            if (!spreadsheetId) {
                // Create new spreadsheet if none exists
                spreadsheetId = await this.createNewSpreadsheet(folderId);
            }
            
            // Cache the spreadsheet ID
            this.spreadsheetIds.set(folderId, spreadsheetId);
            

            // Get the sheet ID
            if (!this.sheetIds.has(folderId)) {
                const spreadsheet = await this.sheetsApi.spreadsheets.get({
                    spreadsheetId
                });
                this.sheetIds.set(folderId, spreadsheet.data.sheets[0].properties.sheetId);
            }

            return spreadsheetId;
        } catch (error) {
            console.error('Error in initializeSpreadsheet:', error);
            throw error;
        }
    }

    async addEntry(entry, folderId) {
        try {
            console.log('Starting to add entry with folder ID:', folderId);
            if (!folderId) {
                throw new Error('Folder ID is required');
            }

            const spreadsheetId = await this.initializeSpreadsheet(folderId);
            console.log('Using spreadsheet ID:', spreadsheetId);
            
            if (!spreadsheetId) {
                throw new Error('Failed to initialize spreadsheet');
            }

            // Get the last row number
            console.log('Getting last row number...');
            const response = await this.sheetsApi.spreadsheets.values.get({
                spreadsheetId,
                range: 'Entries!A:A'
            });

            if (!response || !response.data) {
                throw new Error('Failed to get sheet data');
            }

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

            console.log('Adding entry to sheet at row:', nextRow);
            console.log('Entry data:', JSON.stringify(entryData));

            // Add the new entry
            const updateResponse = await this.sheetsApi.spreadsheets.values.update({
                spreadsheetId,
                range: `Entries!A${nextRow}:H${nextRow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [entryData]
                }
            });

            if (!updateResponse || !updateResponse.data) {
                throw new Error('Failed to update sheet');
            }

            console.log('Entry added successfully. Update response:', JSON.stringify(updateResponse.data));

            try {
                console.log('Auto-resizing columns...');
                const sheetId = this.sheetIds.get(folderId);
                if (!sheetId) {
                    throw new Error('Sheet ID not found for folder');
                }

                await this.sheetsApi.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                autoResizeDimensions: {
                                    dimensions: {
                                        sheetId: sheetId,
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