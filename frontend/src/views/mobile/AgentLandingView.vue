<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-12">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="inline-block p-4 bg-white rounded-full shadow-lg mb-6">
          <svg
            class="w-16 h-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Field Agent Portal
        </h1>
        <p class="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Welcome to the eTally Election Management System. Join us as a field
          agent to help ensure transparent and accurate election results.
        </p>
      </div>

      <!-- Action Cards -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
      >
        <!-- Login Card -->
        <router-link to="/agent/login" class="group">
          <div
            class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-blue-500"
          >
            <div
              class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors"
            >
              <svg
                class="w-8 h-8 text-blue-600 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Agent Login</h3>
            <p class="text-gray-600 mb-4">
              Already registered? Login to access your dashboard and submit
              results.
            </p>
            <div class="flex items-center text-blue-600 font-medium">
              Sign In
              <svg
                class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </router-link>

        <!-- Register Card -->
        <router-link to="/agent/register" class="group">
          <div
            class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-green-500"
          >
            <div
              class="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors"
            >
              <svg
                class="w-8 h-8 text-green-600 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              New Registration
            </h3>
            <p class="text-gray-600 mb-4">
              Apply to become a certified field agent. Quick and easy
              registration process.
            </p>
            <div class="flex items-center text-green-600 font-medium">
              Register Now
              <svg
                class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </router-link>

        <!-- Track Application Card -->
        <router-link to="/agent/track" class="group">
          <div
            class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-purple-500"
          >
            <div
              class="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors"
            >
              <svg
                class="w-8 h-8 text-purple-600 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              Track Application
            </h3>
            <p class="text-gray-600 mb-4">
              Check the status of your field agent application using your
              tracking number.
            </p>
            <div class="flex items-center text-purple-600 font-medium">
              Track Status
              <svg
                class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Features Section -->
      <div class="max-w-5xl mx-auto">
        <div class="bg-white rounded-xl shadow-md p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You'll Do as a Field Agent
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">
                  Monitor Polling Stations
                </h4>
                <p class="text-sm text-gray-600">
                  Observe voting processes and ensure electoral integrity at
                  assigned polling stations.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">
                  Submit Election Results
                </h4>
                <p class="text-sm text-gray-600">
                  Record and submit official results from Form 34A directly from
                  the field.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">
                  Upload Form 34A Photos
                </h4>
                <p class="text-sm text-gray-600">
                  Capture and upload official result forms for verification and
                  transparency.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-1">Work Offline</h4>
                <p class="text-sm text-gray-600">
                  Submit results even without internet. Data syncs automatically
                  when you're back online.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Section -->
      <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-xl shadow-md p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
            How to Get Started
          </h2>
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
              >
                1
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Register</h4>
                <p class="text-sm text-gray-600">
                  Complete the registration form with your personal information
                  and preferred assignment location.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
              >
                2
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">
                  Track Your Application
                </h4>
                <p class="text-sm text-gray-600">
                  Use your tracking number to monitor your application status.
                  Review typically takes 24-48 hours.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
              >
                3
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">
                  Set Up Your Password
                </h4>
                <p class="text-sm text-gray-600">
                  Once approved, you'll receive an SMS with a link to set up
                  your secure password.
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div
                class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold"
              >
                4
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Start Observing</h4>
                <p class="text-sm text-gray-600">
                  Login to your dashboard, view assigned stations, and submit
                  results on election day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div
        class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12"
      >
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-3xl font-bold text-blue-600 mb-1">Fast</div>
          <div class="text-sm text-gray-600">5-Minute Registration</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-3xl font-bold text-green-600 mb-1">Secure</div>
          <div class="text-sm text-gray-600">Encrypted Data</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-3xl font-bold text-purple-600 mb-1">24/7</div>
          <div class="text-sm text-gray-600">Always Available</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <div class="text-3xl font-bold text-orange-600 mb-1">Offline</div>
          <div class="text-sm text-gray-600">Works Without WiFi</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-12 text-gray-600">
        <p class="text-sm">
          Need help?
          <a
            href="mailto:support@etally.com"
            class="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact Support
          </a>
        </p>
        <p class="text-xs mt-2">
          © 2025 eTally Election Management System. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed for static landing page
</script>
