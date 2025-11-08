/**
 * Political Party Controller
 * HTTP handlers for party management
 */

import { Request, Response, NextFunction } from 'express';
import PartyService from './party.service';
import {
  createPartySchema,
  updatePartySchema,
  partyFiltersSchema,
} from './party.validator';
import { ValidationError } from '@/shared/types/errors';

class PartyController {
  private partyService: PartyService;

  constructor() {
    this.partyService = new PartyService();
  }

  /**
   * Create party
   * POST /api/v1/parties
   */
  createParty = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = createPartySchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const party = await this.partyService.createParty(validationResult.data);

      res.status(201).json({
        success: true,
        message: 'Party created successfully',
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all parties
   * GET /api/v1/parties
   */
  getParties = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = partyFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const parties = await this.partyService.getParties(validationResult.data);

      res.status(200).json({
        success: true,
        message: 'Parties retrieved successfully',
        data: parties,
        count: parties.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get party by ID
   * GET /api/v1/parties/:id
   */
  getParty = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const party = await this.partyService.getPartyById(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Party retrieved successfully',
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update party
   * PUT /api/v1/parties/:id
   */
  updateParty = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationResult = updatePartySchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const party = await this.partyService.updateParty(
        req.params.id,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Party updated successfully',
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete party
   * DELETE /api/v1/parties/:id
   */
  deleteParty = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.partyService.deleteParty(req.params.id);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get party statistics
   * GET /api/v1/parties/statistics/summary
   */
  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.partyService.getPartyStatistics();

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload parties from CSV
   * POST /api/v1/parties/upload
   */
  uploadPartiesCSV = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Parse CSV file manually (simple CSV parser)
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length <= 1) {
        throw new ValidationError('CSV file is empty or invalid');
      }

      // Parse headers
      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));

      // Parse rows
      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }

      // Bulk upload
      const result = await this.partyService.bulkUploadParties(records);

      res.status(200).json({
        success: true,
        message: `Upload completed: ${result.success} successful, ${result.failed} failed`,
        data: {
          successful: result.success,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download parties as CSV
   * GET /api/v1/parties/download
   */
  downloadPartiesCSV = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { headers, rows } = await this.partyService.exportPartiesToCSV();

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="political-parties-${new Date().toISOString().split('T')[0]}.csv"`
      );

      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload party logo
   * POST /api/v1/parties/:id/logo
   */
  uploadLogo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new ValidationError(
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new ValidationError('File size exceeds 5MB limit.');
      }

      const logoPath = await this.partyService.uploadLogo(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logoPath,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get party logo URL
   * GET /api/v1/parties/:id/logo
   */
  getLogoUrl = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const logoUrl = await this.partyService.getLogoUrl(req.params.id);

      res.status(200).json({
        success: true,
        data: {
          logoUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default PartyController;
