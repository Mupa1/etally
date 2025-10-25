/**
 * Configuration Management Service
 * Business logic for managing system configurations
 */

import PrismaService from '@/infrastructure/database/prisma.service';
import { NotFoundError, ValidationError } from '@/shared/types/errors';
import { ConfigurationType } from '@prisma/client';
import { encrypt, decrypt, isEncrypted } from '@/shared/utils/encryption.util';

interface ICreateConfigurationData {
  key: string;
  name: string;
  description?: string;
  value?: string;
  type: ConfigurationType;
  category: string;
  isRequired?: boolean;
  isDefault?: boolean;
}

interface IUpdateConfigurationData {
  name?: string;
  description?: string;
  value?: string;
  type?: ConfigurationType;
  category?: string;
  isRequired?: boolean;
  isDefault?: boolean;
}

interface IConfigurationFilters {
  category?: string;
  type?: ConfigurationType;
  isRequired?: boolean;
  search?: string;
}

class ConfigurationService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Check if a configuration key contains "password"
   */
  private isPasswordField(key: string): boolean {
    return key.toLowerCase().includes('password');
  }

  /**
   * Parse configuration value based on type
   */
  private parseValue(
    value: string | null,
    type: ConfigurationType,
    key: string
  ): any {
    if (value === null || value === undefined) return null;

    // Decrypt password fields
    if (this.isPasswordField(key) && isEncrypted(value)) {
      try {
        value = decrypt(value);
      } catch (error) {
        console.error('Failed to decrypt password field:', error);
        // Return masked value if decryption fails
        return '***ENCRYPTED***';
      }
    }

    switch (type) {
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) throw new ValidationError('Invalid number value');
        return num;
      case 'boolean':
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new ValidationError('Invalid boolean value');
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          throw new ValidationError('Invalid JSON value');
        }
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Stringify configuration value for storage
   */
  private stringifyValue(
    value: any,
    type: ConfigurationType,
    key: string
  ): string | null {
    if (value === null || value === undefined) return null;

    let stringValue: string;

    switch (type) {
      case 'number':
        stringValue = String(value);
        break;
      case 'boolean':
        stringValue = String(value);
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      case 'string':
      default:
        stringValue = String(value);
        break;
    }

    // Encrypt password fields
    if (this.isPasswordField(key)) {
      // Only encrypt if not already encrypted
      if (!isEncrypted(stringValue)) {
        try {
          stringValue = encrypt(stringValue);
        } catch (error) {
          console.error('Failed to encrypt password field:', error);
          throw new ValidationError('Failed to encrypt password value');
        }
      }
    }

    return stringValue;
  }

  /**
   * Create a new configuration
   */
  async createConfiguration(userId: string, data: ICreateConfigurationData) {
    // Check if configuration key already exists
    const existing = await this.prisma.configuration.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new ValidationError(
        `Configuration with key "${data.key}" already exists`
      );
    }

    // Validate value if provided and stringify for storage
    const createData: any = { ...data };
    if (data.value !== undefined) {
      this.parseValue(data.value, data.type, data.key);
      createData.value = this.stringifyValue(data.value, data.type, data.key);
    }

    const configuration = await this.prisma.configuration.create({
      data: {
        ...createData,
        lastModified: new Date(),
        modifiedBy: userId,
      },
    });

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }

  /**
   * Get all configurations with optional filters
   */
  async getConfigurations(filters?: IConfigurationFilters) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isRequired !== undefined) {
      where.isRequired = filters.isRequired;
    }

    if (filters?.search) {
      where.OR = [
        { key: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const configurations = await this.prisma.configuration.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return configurations.map((config) => ({
      ...config,
      value: this.parseValue(config.value, config.type, config.key),
    }));
  }

  /**
   * Get configuration by ID
   */
  async getConfigurationById(id: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!configuration) {
      throw new NotFoundError('Configuration', id);
    }

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }

  /**
   * Get configuration by key
   */
  async getConfigurationByKey(key: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { key },
    });

    if (!configuration) {
      throw new NotFoundError('Configuration', key);
    }

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }

  /**
   * Get configurations by category
   */
  async getConfigurationsByCategory(category: string) {
    const configurations = await this.prisma.configuration.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });

    return configurations.map((config) => ({
      ...config,
      value: this.parseValue(config.value, config.type, config.key),
    }));
  }

  /**
   * Update configuration
   */
  async updateConfiguration(
    id: string,
    userId: string,
    data: IUpdateConfigurationData
  ) {
    const existing = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Configuration', id);
    }

    // Validate value if provided and stringify it for storage
    const type = data.type || existing.type;
    const updateData: any = { ...data };

    if (data.value !== undefined) {
      // Validate the value first
      this.parseValue(data.value, type, existing.key);
      // Stringify the value for storage
      updateData.value = this.stringifyValue(data.value, type, existing.key);
    }

    const configuration = await this.prisma.configuration.update({
      where: { id },
      data: {
        ...updateData,
        lastModified: new Date(),
        modifiedBy: userId,
      },
    });

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }

  /**
   * Update configuration value by key
   */
  async updateConfigurationValue(key: string, userId: string, value: any) {
    const existing = await this.prisma.configuration.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundError('Configuration', key);
    }

    // Validate and stringify value
    this.parseValue(value, existing.type, existing.key);
    const stringValue = this.stringifyValue(value, existing.type, existing.key);

    const configuration = await this.prisma.configuration.update({
      where: { key },
      data: {
        value: stringValue,
        isDefault: false, // Mark as custom when value is changed
        lastModified: new Date(),
        modifiedBy: userId,
      },
    });

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration(id: string) {
    const existing = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Configuration', id);
    }

    // Prevent deletion of required configurations
    if (existing.isRequired) {
      throw new ValidationError(
        'Cannot delete required configuration. Update it instead.'
      );
    }

    await this.prisma.configuration.delete({
      where: { id },
    });

    return { message: 'Configuration deleted successfully' };
  }

  /**
   * Get configuration categories with counts
   */
  async getCategories() {
    const configurations = await this.prisma.configuration.findMany({
      select: {
        category: true,
      },
    });

    // Group by category and count
    const categoryMap = new Map<string, number>();
    configurations.forEach((config) => {
      const count = categoryMap.get(config.category) || 0;
      categoryMap.set(config.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  /**
   * Bulk create configurations
   */
  async bulkCreateConfigurations(
    userId: string,
    configurations: ICreateConfigurationData[]
  ) {
    const results = [];

    for (const configData of configurations) {
      try {
        const config = await this.createConfiguration(userId, configData);
        results.push({ success: true, data: config });
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          key: configData.key,
        });
      }
    }

    return results;
  }

  /**
   * Reset configuration to default value
   */
  async resetToDefault(id: string, userId: string) {
    const existing = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Configuration', id);
    }

    // This would need a default value stored somewhere
    // For now, we'll just set value to null and mark as default
    const configuration = await this.prisma.configuration.update({
      where: { id },
      data: {
        value: null,
        isDefault: true,
        lastModified: new Date(),
        modifiedBy: userId,
      },
    });

    return {
      ...configuration,
      value: this.parseValue(
        configuration.value,
        configuration.type,
        configuration.key
      ),
    };
  }
}

export default ConfigurationService;
